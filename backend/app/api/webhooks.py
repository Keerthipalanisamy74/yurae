import json
import logging
from typing import Dict, Any
from fastapi import APIRouter, Request, Header, HTTPException, status, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import Order, Payment, Product
from app.services.payment_service import RazorpayPaymentProvider, StripePaymentProvider
from app.services.shipping_service import ShippingService
from app.services.email_service import EmailService

logger = logging.getLogger("yurae.webhooks")

router = APIRouter(prefix="/webhooks", tags=["Payment & Integration Webhooks"])

@router.post("/razorpay")
async def razorpay_webhook(
    request: Request,
    x_razorpay_signature: str = Header(None, alias="X-Razorpay-Signature"),
    db: Session = Depends(get_db)
):
    """
    Asynchronous Webhook receiver for Razorpay payments, captures, and refunds.
    Reconciles orders even if the user disconnects before redirecting to the success page.
    """
    raw_body = await request.body()
    provider = RazorpayPaymentProvider()

    # 1. Cryptographic Signature Verification
    if provider.is_live_configured():
        if not x_razorpay_signature:
            logger.warning("Razorpay webhook rejected: Missing X-Razorpay-Signature header")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing signature header")

        is_valid = provider.verify_webhook_signature(raw_body, x_razorpay_signature)
        if not is_valid:
            logger.warning("Razorpay webhook rejected: Invalid signature")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid webhook signature")

    try:
        data: Dict[str, Any] = json.loads(raw_body.decode("utf-8"))
    except Exception as e:
        logger.error(f"Failed to parse Razorpay webhook JSON: {e}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Malformed JSON")

    event_type = data.get("event", "")
    payload = data.get("payload", {})
    logger.info(f"Received Razorpay Webhook Event: {event_type}")

    # 2. Extract Order Reference & Payment Details
    order_number = None
    payment_entity = payload.get("payment", {}).get("entity", {})
    order_entity = payload.get("order", {}).get("entity", {})

    if payment_entity:
        order_number = payment_entity.get("notes", {}).get("order_number")
    if not order_number and order_entity:
        order_number = order_entity.get("receipt")

    rzp_payment_id = payment_entity.get("id")
    rzp_order_id = payment_entity.get("order_id") or order_entity.get("id")

    # 3. Reconcile Order in Database
    order = None
    if order_number:
        order = db.query(Order).filter(Order.order_number == order_number).first()

    if not order and (rzp_payment_id or rzp_order_id):
        # Look up existing payment record
        pay = db.query(Payment).filter(
            (Payment.payment_id == rzp_payment_id) | (Payment.payment_id == rzp_order_id)
        ).first()
        if pay:
            order = pay.order

    if not order:
        logger.warning(f"Razorpay webhook event '{event_type}' received with no matching order in DB (order_number: {order_number})")
        return {"status": "ignored", "reason": "order_not_found"}

    # 4. Handle Event Transitions
    if event_type in ("payment.captured", "order.paid"):
        if order.payment_status != "Paid":
            order.payment_status = "Paid"
            if order.order_status in ("Pending", "Confirmed"):
                order.order_status = "Confirmed"

            # Update Payment Record
            pay_record = db.query(Payment).filter(Payment.order_id == order.id).first()
            if pay_record:
                pay_record.status = "SUCCESS"
                if rzp_payment_id:
                    pay_record.payment_id = rzp_payment_id
            else:
                new_pay = Payment(
                    order_id=order.id,
                    payment_id=rzp_payment_id or rzp_order_id or "rzp_webhook_capture",
                    payment_method="Razorpay",
                    currency=order.currency or "INR",
                    amount=order.total_amount,
                    status="SUCCESS"
                )
                db.add(new_pay)

            db.commit()
            db.refresh(order)
            logger.info(f"Razorpay Webhook: Successfully reconciled Order #{order.order_number} as PAID")

            # Trigger automated shipment & order confirmation email
            try:
                ShippingService.execute_automated_shipping_flow(order.id, db)
            except Exception as e:
                logger.error(f"Shipping pipeline trigger error in Razorpay webhook: {e}")

            try:
                EmailService.send_order_confirmation_email(order, order.user)
            except Exception as e:
                logger.error(f"Email dispatch error in Razorpay webhook: {e}")

    elif event_type == "payment.failed":
        logger.warning(f"Payment failed for Order #{order.order_number}")
        pay_record = db.query(Payment).filter(Payment.order_id == order.id).first()
        if pay_record:
            pay_record.status = "FAILED"
            db.commit()

    elif event_type == "refund.processed":
        logger.info(f"Refund processed for Order #{order.order_number}")
        order.payment_status = "Refunded"
        pay_record = db.query(Payment).filter(Payment.order_id == order.id).first()
        if pay_record:
            pay_record.status = "REFUNDED"
        db.commit()

    return {"status": "success", "event": event_type, "order_number": order.order_number}


@router.post("/stripe")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="Stripe-Signature"),
    db: Session = Depends(get_db)
):
    """
    Asynchronous Webhook receiver for Stripe PaymentIntents and Refunds.
    """
    raw_body = await request.body()
    provider = StripePaymentProvider()

    # 1. Cryptographic Signature Verification
    if provider.is_live_configured():
        if not stripe_signature:
            logger.warning("Stripe webhook rejected: Missing Stripe-Signature header")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing signature header")

        is_valid = provider.verify_webhook_signature(raw_body, stripe_signature)
        if not is_valid:
            logger.warning("Stripe webhook rejected: Invalid signature")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid webhook signature")

    try:
        data: Dict[str, Any] = json.loads(raw_body.decode("utf-8"))
    except Exception as e:
        logger.error(f"Failed to parse Stripe webhook JSON: {e}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Malformed JSON")

    event_type = data.get("type", "")
    event_data = data.get("data", {}).get("object", {})
    logger.info(f"Received Stripe Webhook Event: {event_type}")

    order_number = event_data.get("metadata", {}).get("order_number")
    intent_id = event_data.get("id")

    order = None
    if order_number:
        order = db.query(Order).filter(Order.order_number == order_number).first()
    if not order and intent_id:
        pay = db.query(Payment).filter(Payment.payment_id == intent_id).first()
        if pay:
            order = pay.order

    if not order:
        logger.warning(f"Stripe webhook event '{event_type}' received with no matching order in DB (order_number: {order_number})")
        return {"status": "ignored", "reason": "order_not_found"}

    if event_type == "payment_intent.succeeded":
        if order.payment_status != "Paid":
            order.payment_status = "Paid"
            order.order_status = "Confirmed"

            pay_record = db.query(Payment).filter(Payment.order_id == order.id).first()
            if pay_record:
                pay_record.status = "SUCCESS"
                pay_record.payment_id = intent_id
            else:
                new_pay = Payment(
                    order_id=order.id,
                    payment_id=intent_id or "stripe_intent_capture",
                    payment_method="Stripe",
                    currency=order.currency or "USD",
                    amount=order.total_amount,
                    status="SUCCESS"
                )
                db.add(new_pay)

            db.commit()
            db.refresh(order)
            logger.info(f"Stripe Webhook: Successfully reconciled Order #{order.order_number} as PAID")

            try:
                ShippingService.execute_automated_shipping_flow(order.id, db)
            except Exception as e:
                logger.error(f"Shipping pipeline error in Stripe webhook: {e}")

            try:
                EmailService.send_order_confirmation_email(order, order.user)
            except Exception as e:
                logger.error(f"Email dispatch error in Stripe webhook: {e}")

    elif event_type == "payment_intent.payment_failed":
        pay_record = db.query(Payment).filter(Payment.order_id == order.id).first()
        if pay_record:
            pay_record.status = "FAILED"
            db.commit()

    elif event_type == "charge.refunded":
        order.payment_status = "Refunded"
        pay_record = db.query(Payment).filter(Payment.order_id == order.id).first()
        if pay_record:
            pay_record.status = "REFUNDED"
        db.commit()

    return {"status": "success", "event": event_type, "order_number": order.order_number}
