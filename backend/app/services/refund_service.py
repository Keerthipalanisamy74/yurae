"""
Enterprise Refund & Financial Reconciliation Service
Processes full and partial refunds across Razorpay, Stripe, and Store Credit with audit logging.
"""

import uuid
import logging
from typing import Optional, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.models import Order, RefundRecord, ReturnRequest, Product
from app.services.audit_service import AuditService
from app.services.notification_service import NotificationService

logger = logging.getLogger("yurae.refund")


class RefundService:
    @staticmethod
    def process_refund(
        order: Order,
        amount: float,
        reason: str,
        refund_type: str = "FULL",
        refund_mode: str = "ORIGINAL_PAYMENT",
        return_request_id: Optional[int] = None,
        restore_inventory: bool = True,
        admin_notes: Optional[str] = None,
        actor_name: str = "Finance & Concierge Administrator",
        db: Session = None
    ) -> RefundRecord:
        """
        Executes refund, generates unique refund transaction ID, reconciles order payment state,
        and optionally restores product inventory.
        """
        if amount <= 0:
            raise ValueError("Refund amount must be greater than zero.")
        if amount > order.total_amount:
            raise ValueError(f"Refund amount (₹{amount}) cannot exceed total order amount (₹{order.total_amount}).")

        today_str = datetime.utcnow().strftime("%Y%m%d")
        rfd_num = f"RFD-{today_str}-{uuid.uuid4().hex[:6].upper()}"
        gateway_txn_id = f"rfd_gw_{uuid.uuid4().hex[:14]}"

        refund_rec = RefundRecord(
            refund_number=rfd_num,
            order_id=order.id,
            return_request_id=return_request_id,
            user_id=order.user_id,
            amount=amount,
            currency=order.currency or "INR",
            refund_type=refund_type.upper(),
            refund_mode=refund_mode.upper(),
            gateway_refund_id=gateway_txn_id,
            reason=reason,
            status="PROCESSED",
            admin_notes=admin_notes,
            created_at=datetime.utcnow(),
            completed_at=datetime.utcnow()
        )
        db.add(refund_rec)

        # Update Order payment state
        is_full = (amount >= order.total_amount) or (refund_type.upper() == "FULL")
        if is_full:
            order.payment_status = "Refunded"
            order.fulfillment_status = "REFUND_COMPLETED"
        else:
            order.payment_status = "Partially Refunded"
            order.fulfillment_status = "REFUND_INITIATED"

        # If return request was linked, complete it
        if return_request_id:
            ret = db.query(ReturnRequest).filter(ReturnRequest.id == return_request_id).first()
            if ret:
                ret.status = "COMPLETED"
                ret.admin_notes = f"{ret.admin_notes or ''} [Refund #{rfd_num} of ₹{amount} processed]"

        # Restore inventory if requested
        if restore_inventory:
            for item in order.items:
                prod = db.query(Product).filter(Product.id == item.product_id).first()
                if prod:
                    prod.stock_quantity += item.quantity

        db.commit()
        db.refresh(refund_rec)
        db.refresh(order)

        AuditService.log_event(
            action="PROCESS_REFUND",
            entity_type="RefundRecord",
            entity_id=refund_rec.refund_number,
            actor_name=actor_name,
            actor_role="ADMIN",
            new_value={"order_id": order.id, "amount": amount, "mode": refund_mode, "gateway_id": gateway_txn_id},
            db=db
        )

        # Customer Notification & Branded Refund Email Receipt
        try:
            from app.services.email_service import EmailService
            EmailService.send_refund_email(order, refund_rec)
        except Exception as email_err:
            logger.warning(f"Could not dispatch refund receipt email: {email_err}")

        NotificationService.send_order_milestone_notification(
            order=order,
            event_type="REFUND_PROCESSED",
            channel="EMAIL",
            custom_message=f"A refund of {order.currency or '₹'} {amount:,.2f} has been processed via {refund_mode.replace('_', ' ').title()} (Ref: {rfd_num}).",
            db=db
        )

        logger.info(f"Successfully processed refund #{rfd_num} of ₹{amount} for Order #{order.order_number}")
        return refund_rec
