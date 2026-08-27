import uuid
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import Order, OrderItem, Cart, CartItem, Product, Address, Payment, Coupon, User
from app.schemas.schemas import (
    OrderResponse, OrderCreate, OrderStatusUpdate,
    PaymentInitiateRequest, PaymentInitiateResponse
)
from app.api.deps import get_current_user, get_current_admin
from app.api.cart import get_or_create_user_cart
from app.core.config import settings
from app.services.exchange_rate_service import ExchangeRateService, CURRENCY_METADATA
from app.services.shipping_service import ShippingService
from app.services.payment_service import PaymentService

router = APIRouter(prefix="/orders", tags=["Orders"])

def generate_order_number() -> str:
    today_str = datetime.utcnow().strftime("%Y%m%d")
    unique_suffix = str(uuid.uuid4().hex[:6]).upper()
    return f"YURAE-{today_str}-{unique_suffix}"

@router.post("/initiate-payment", response_model=PaymentInitiateResponse)
def initiate_payment(
    init_in: PaymentInitiateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Pre-order payment initialization: creates Razorpay Order or Stripe PaymentIntent
    so client can launch official checkout modal before finalizing the order.
    """
    cart = get_or_create_user_cart(current_user.id, db)
    if not cart.items:
        raise HTTPException(status_code=400, detail="Your beauty bag is empty.")

    target_currency = (init_in.currency or "INR").upper()
    rates = ExchangeRateService.get_rates(db)
    if target_currency not in rates:
        target_currency = "INR"

    decimals = CURRENCY_METADATA.get(target_currency, {}).get("decimal_digits", 2)

    inr_subtotal = 0.0
    for item in cart.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product and product.status == "ACTIVE":
            base_unit_price = product.sale_price if product.sale_price else product.price
            inr_subtotal += base_unit_price * item.quantity

    subtotal = ExchangeRateService.convert_amount(
        amount=inr_subtotal,
        from_currency="INR",
        to_currency=target_currency,
        db=db
    )

    discount = 0.0
    if init_in.coupon_code:
        coupon = db.query(Coupon).filter(Coupon.code == init_in.coupon_code.upper(), Coupon.active == True).first()
        if coupon and inr_subtotal >= coupon.minimum_order_amount:
            if coupon.discount_type == "PERCENTAGE":
                discount = (subtotal * coupon.discount_value) / 100.0
            else:
                converted_coupon_val = ExchangeRateService.convert_amount(
                    amount=coupon.discount_value,
                    from_currency="INR",
                    to_currency=target_currency,
                    db=db
                )
                discount = min(converted_coupon_val, subtotal)

    shipping_calc = ShippingService.calculate_shipping(
        country=init_in.country or "India",
        subtotal=subtotal,
        target_currency=target_currency,
        db=db
    )
    shipping_fee = shipping_calc["shipping_fee"]

    total_amount = max(0.0, subtotal - discount + shipping_fee)
    total_amount = round(total_amount, decimals if decimals > 0 else 0)

    order_num = generate_order_number()

    pay_result = PaymentService.process_checkout_payment(
        payment_method=init_in.payment_method,
        amount=total_amount,
        currency=target_currency,
        order_number=order_num,
        customer_info={"name": f"{current_user.first_name} {current_user.last_name}", "email": current_user.email}
    )

    is_sandbox = bool(pay_result.raw_data.get("is_sandbox", False))

    return PaymentInitiateResponse(
        success=pay_result.success,
        order_number=order_num,
        gateway_order_id=pay_result.gateway_order_id,
        client_secret=pay_result.client_secret,
        key_id=pay_result.raw_data.get("key_id") or pay_result.raw_data.get("publishable_key") or settings.RAZORPAY_KEY_ID,
        amount=total_amount,
        currency=target_currency,
        is_sandbox=is_sandbox,
        message=pay_result.message
    )

@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    order_in: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cart = get_or_create_user_cart(current_user.id, db)
    if not cart.items:
        raise HTTPException(status_code=400, detail="Your beauty bag is empty.")

    # 1. Determine shipping destination address
    address_id = order_in.address_id
    dest_country = "India"
    if not address_id:
        if order_in.new_address:
            new_addr = Address(
                user_id=current_user.id,
                name=order_in.new_address.name,
                phone=order_in.new_address.phone,
                address_line1=order_in.new_address.address_line1,
                address_line2=order_in.new_address.address_line2,
                city=order_in.new_address.city,
                state=order_in.new_address.state,
                postal_code=order_in.new_address.postal_code,
                country=order_in.new_address.country or "India",
                is_default=order_in.new_address.is_default
            )
            db.add(new_addr)
            db.commit()
            db.refresh(new_addr)
            address_id = new_addr.id
            dest_country = new_addr.country
        else:
            default_addr = db.query(Address).filter(Address.user_id == current_user.id, Address.is_default == True).first()
            if default_addr:
                address_id = default_addr.id
                dest_country = default_addr.country
            else:
                first_addr = db.query(Address).filter(Address.user_id == current_user.id).first()
                if first_addr:
                    address_id = first_addr.id
                    dest_country = first_addr.country
                else:
                    raise HTTPException(status_code=400, detail="Shipping address is required.")
    else:
        addr = db.query(Address).filter(Address.id == address_id).first()
        if addr:
            dest_country = addr.country

    # 2. Transaction currency validation and exchange rate lookup
    target_currency = (order_in.currency or "INR").upper()
    rates = ExchangeRateService.get_rates(db)
    if target_currency not in rates:
        target_currency = "INR"

    exchange_rate = float(rates.get(target_currency, 1.0))
    decimals = CURRENCY_METADATA.get(target_currency, {}).get("decimal_digits", 2)

    # 3. Calculate authoritative base price subtotal in INR and check stock
    inr_subtotal = 0.0
    items_to_create = []

    for item in cart.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product or product.status != "ACTIVE":
            raise HTTPException(status_code=400, detail=f"Product {item.product_id} is no longer available.")
        if product.stock_quantity < item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for '{product.name}'. Available: {product.stock_quantity}")

        base_unit_price = product.sale_price if product.sale_price else product.price
        inr_subtotal += base_unit_price * item.quantity

        converted_unit_price = ExchangeRateService.convert_amount(
            amount=base_unit_price,
            from_currency="INR",
            to_currency=target_currency,
            db=db
        )

        variant_info_str = None
        if item.variant:
            variant_info_str = f"{item.variant.variant_name}: {item.variant.variant_value}"

        items_to_create.append({
            "product": product,
            "product_name": product.name,
            "variant": item.variant,
            "variant_info": variant_info_str,
            "quantity": item.quantity,
            "price": converted_unit_price
        })

    # 4. Converted Subtotal in Transaction Currency
    subtotal = ExchangeRateService.convert_amount(
        amount=inr_subtotal,
        from_currency="INR",
        to_currency=target_currency,
        db=db
    )

    # 5. Coupon discount calculation
    discount = 0.0
    if order_in.coupon_code:
        coupon = db.query(Coupon).filter(Coupon.code == order_in.coupon_code.upper(), Coupon.active == True).first()
        if coupon:
            if inr_subtotal >= coupon.minimum_order_amount:
                if coupon.discount_type == "PERCENTAGE":
                    discount = (subtotal * coupon.discount_value) / 100.0
                else:
                    converted_coupon_val = ExchangeRateService.convert_amount(
                        amount=coupon.discount_value,
                        from_currency="INR",
                        to_currency=target_currency,
                        db=db
                    )
                    discount = min(converted_coupon_val, subtotal)
                coupon.times_used += 1

    discount = round(discount, decimals if decimals > 0 else 0)

    # 6. International / Domestic Shipping calculation
    shipping_calc = ShippingService.calculate_shipping(
        country=dest_country,
        subtotal=subtotal,
        target_currency=target_currency,
        db=db
    )
    shipping_fee = shipping_calc["shipping_fee"]

    # Tax (included or 0.0)
    tax = 0.0

    total_amount = max(0.0, subtotal - discount + shipping_fee + tax)
    total_amount = round(total_amount, decimals if decimals > 0 else 0)

    order_num = generate_order_number()

    # 7. Strict COD Validation (COD is strictly allowed ONLY for India)
    is_cod = order_in.payment_method.strip().upper() in ["COD", "CASH ON DELIVERY", "CASH_ON_DELIVERY", "CASH"]
    is_india = dest_country.strip().lower() in ["india", "in", "bharat"]

    if is_cod and not is_india:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cash on Delivery (COD) is available only for Indian domestic deliveries. International orders require prepaid online payment."
        )

    # 8. Cryptographic Signature Verification for Prepaid Orders
    final_payment_id = order_in.payment_id
    if not is_cod and order_in.is_paid:
        if order_in.razorpay_signature:
            verify_res = PaymentService.verify_checkout_payment(
                payment_method="Razorpay",
                payment_id=order_in.razorpay_payment_id or order_in.payment_id or "",
                order_id=order_in.razorpay_order_id or "",
                payload={
                    "razorpay_signature": order_in.razorpay_signature,
                    "razorpay_order_id": order_in.razorpay_order_id,
                    "razorpay_payment_id": order_in.razorpay_payment_id,
                    "currency": target_currency
                }
            )
            if not verify_res.success:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Payment signature verification failed: {verify_res.message}"
                )
            final_payment_id = order_in.razorpay_payment_id or final_payment_id

        elif order_in.stripe_payment_intent_id:
            verify_res = PaymentService.verify_checkout_payment(
                payment_method="Stripe",
                payment_id=order_in.stripe_payment_intent_id,
                order_id="",
                payload={"stripe_payment_intent_id": order_in.stripe_payment_intent_id, "currency": target_currency}
            )
            if not verify_res.success:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Stripe payment verification failed: {verify_res.message}"
                )
            final_payment_id = order_in.stripe_payment_intent_id or final_payment_id

    if is_cod or not order_in.is_paid:
        order_payment_status = "Pending"
        payment_status_db = "PENDING"
    else:
        order_payment_status = "Paid"
        payment_status_db = "SUCCESS"
        
    order_status = "Confirmed"

    new_order = Order(
        user_id=current_user.id,
        address_id=address_id,
        order_number=order_num,
        currency=target_currency,
        exchange_rate=exchange_rate,
        subtotal=subtotal,
        discount=discount,
        shipping_fee=shipping_fee,
        tax=tax,
        total_amount=total_amount,
        payment_status=order_payment_status,
        order_status=order_status,
        is_cod=is_cod,
        cod_amount=total_amount if is_cod else 0.0,
        shipping_status="NOT_CREATED"
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    # 9. Create Order Items & decrement inventory stock automatically
    for item_data in items_to_create:
        o_item = OrderItem(
            order_id=new_order.id,
            product_id=item_data["product"].id,
            product_name=item_data["product_name"],
            variant_info=item_data["variant_info"],
            quantity=item_data["quantity"],
            price=item_data["price"]
        )
        db.add(o_item)
        
        product = item_data["product"]
        ordered_qty = item_data["quantity"]
        product.stock_quantity = max(0, product.stock_quantity - ordered_qty)
        
        variant = item_data.get("variant")
        if variant:
            variant.stock_quantity = max(0, variant.stock_quantity - ordered_qty)

    # 10. Create Payment record
    pay_record = Payment(
        order_id=new_order.id,
        payment_id=final_payment_id or f"pay_{uuid.uuid4().hex[:10]}",
        payment_method=order_in.payment_method,
        currency=target_currency,
        amount=total_amount,
        status=payment_status_db
    )
    db.add(pay_record)

    # 11. Clear user cart
    db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()

    db.commit()
    db.refresh(new_order)

    # 12. Automatic Indian Shipping & Order Fulfillment (Shiprocket)
    # Trigger shipment pipeline for paid prepaid orders and COD orders
    # 12. Automatic Indian Shipping & Order Fulfillment (Shiprocket)
    if is_cod or order_payment_status.upper() == "PAID":
        try:
            ShippingService.execute_automated_shipping_flow(new_order.id, db)
            db.refresh(new_order)
        except Exception as e:
            # Crucial: Order is already safely created in DB. Do not fail the checkout response if shipping provider encounters network latency.
            print(f"Warning: Async shipping pipeline deferred for Order #{new_order.order_number}: {e}")

    # 13. Dispatch Luxury Order Confirmation Email & Admin Alert
    try:
        from app.services.email_service import EmailService
        EmailService.send_order_confirmation_email(new_order, current_user)
        EmailService.send_admin_new_order_alert_email(new_order, current_user)
    except Exception as email_err:
        print(f"Warning: Could not send order notification emails: {email_err}")

    return new_order

@router.get("", response_model=List[OrderResponse])
def get_user_orders(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Order).filter(Order.user_id == current_user.id).order_by(Order.created_at.desc()).all()

@router.get("/{identifier}", response_model=OrderResponse)
def get_order_by_id_or_number(identifier: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if identifier.isdigit():
        order = db.query(Order).filter(Order.id == int(identifier)).first()
    else:
        order = db.query(Order).filter(Order.order_number == identifier).first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.user_id != current_user.id and current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Not authorized to view this order")

    return order

@router.get("/{identifier}/invoice")
def get_order_invoice(identifier: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Returns structured tax invoice data for printing or client-side PDF rendering.
    """
    if identifier.isdigit():
        order = db.query(Order).filter(Order.id == int(identifier)).first()
    else:
        order = db.query(Order).filter(Order.order_number == identifier).first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.user_id != current_user.id and current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Not authorized to view this invoice")

    addr = order.address
    buyer_user = order.user
    buyer_name = addr.name if addr else (f"{buyer_user.first_name} {buyer_user.last_name}" if buyer_user else "Valued Patron")
    buyer_email = buyer_user.email if buyer_user else "customer@yuraebeauty.com"
    buyer_phone = addr.phone if addr else (buyer_user.phone if buyer_user and buyer_user.phone else "N/A")
    payment_method = order.payments[0].payment_method if order.payments else ("Cash on Delivery (COD)" if order.is_cod else "Prepaid Online")

    seller_company = getattr(settings, 'SELLER_COMPANY_NAME', 'Yurae Beauty & Luxury Apparel Private Limited')
    seller_gstin = getattr(settings, 'SELLER_GSTIN', '33AAECY8721M1Z8')
    seller_pan = getattr(settings, 'SELLER_PAN', 'AAECY8721M')
    seller_state = getattr(settings, 'SELLER_STATE', 'Tamil Nadu')
    seller_state_code = getattr(settings, 'SELLER_STATE_CODE', '33')
    seller_address = getattr(settings, 'SELLER_ADDRESS', '74, Avenue Montaigne Botanical Complex, Anna Salai, Chennai, Tamil Nadu - 600002')
    seller_email = getattr(settings, 'SELLER_EMAIL', 'concierge@yuraebeauty.com')
    seller_phone = getattr(settings, 'SELLER_PHONE', '+91 98765 43210')

    buyer_country = (addr.country if addr else "India").strip()
    buyer_state = (addr.state if addr else "Tamil Nadu").strip()
    is_export = buyer_country.lower() not in ("india", "in", "bharat")
    is_intra_state = not is_export and (buyer_state.lower() == seller_state.lower() or seller_state.lower() in buyer_state.lower())

    tax_val = order.tax or 0.0
    cgst_val = round(tax_val / 2, 2) if is_intra_state else 0.0
    sgst_val = round(tax_val / 2, 2) if is_intra_state else 0.0
    igst_val = round(tax_val, 2) if (not is_intra_state and not is_export) else 0.0

    invoice_data = {
        "invoice_number": f"INV-{order.order_number}",
        "invoice_date": order.created_at.strftime("%d %B %Y") if order.created_at else "Today",
        "place_of_supply": "Export (Zero-Rated supply under LUT)" if is_export else f"{buyer_state}, India",
        "gst_category": "Zero-Rated Export" if is_export else ("Intra-State (CGST + SGST)" if is_intra_state else "Inter-State (IGST)"),
        "seller": {
            "company_name": seller_company,
            "gstin": seller_gstin,
            "pan": seller_pan,
            "state_code": seller_state_code,
            "address": seller_address,
            "city": "Chennai",
            "state": seller_state,
            "postal_code": "600002",
            "country": "India",
            "email": seller_email,
            "phone": seller_phone
        },
        "buyer": {
            "name": buyer_name,
            "email": buyer_email,
            "phone": buyer_phone,
            "address_line1": addr.address_line1 if addr else "Standard Delivery Address",
            "address_line2": addr.address_line2 if addr else "",
            "city": addr.city if addr else "Chennai",
            "state": buyer_state,
            "postal_code": addr.postal_code if addr else "600001",
            "country": buyer_country
        },
        "order_details": {
            "order_number": order.order_number,
            "order_date": order.created_at.strftime("%d %b %Y, %I:%M %p") if order.created_at else "Recent",
            "payment_method": payment_method,
            "payment_status": order.payment_status,
            "currency": order.currency,
            "subtotal": order.subtotal,
            "discount": order.discount or 0.0,
            "shipping": order.shipping_fee or 0.0,
            "total": order.total_amount,
            "cgst": cgst_val,
            "sgst": sgst_val,
            "igst": igst_val,
            "is_export": is_export,
            "items": [
                {
                    "product_name": item.product_name,
                    "variant": item.variant_info,
                    "quantity": item.quantity,
                    "unit_price": item.price,
                    "total_price": item.price * item.quantity,
                    "hsn_code": "33049900" if any(w in item.product_name.lower() for w in ["wash", "serum", "balm", "cream", "lotion", "toner", "cleanser", "mist", "oil"]) else ("71131120" if any(w in item.product_name.lower() for w in ["ring", "necklace", "pendant", "bracelet", "earring", "jewelry", "pearl"]) else "62044390")
                }
                for item in order.items
            ]
        }
    }
    return invoice_data

@router.get("/{identifier}/pdf")
@router.get("/{identifier}/invoice/pdf")
def download_order_invoice_pdf(
    identifier: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generates and returns the exact binary PDF stream of the Tax Invoice.
    """
    from fastapi.responses import Response

    if identifier.isdigit():
        order = db.query(Order).filter(Order.id == int(identifier)).first()
    else:
        order = db.query(Order).filter(Order.order_number == identifier).first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.user_id != current_user.id and current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Not authorized to view this invoice")

    from app.services.invoice_pdf_service import InvoicePdfService
    pdf_bytes = InvoicePdfService.generate_order_invoice_pdf(order)

    filename = f"Yurae-Tax-Invoice-{order.order_number}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )

# Admin operations
@router.put("/{order_id}/status", response_model=OrderResponse)
def update_order_status(
    order_id: int,
    status_in: OrderStatusUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    old_status = (order.order_status or "").upper()
    new_status = (status_in.order_status or "").upper() if status_in.order_status else None

    # If status transitioned to Cancelled, restore product inventory
    if new_status in ["CANCELLED", "CANCELED"] and old_status not in ["CANCELLED", "CANCELED"]:
        for o_item in order.items:
            prod = db.query(Product).filter(Product.id == o_item.product_id).first()
            if prod:
                prod.stock_quantity += o_item.quantity

    if status_in.order_status:
        order.order_status = status_in.order_status
        # If order is delivered, automatically mark COD / pending payment as Paid
        if new_status == "DELIVERED" and (not status_in.payment_status or order.payment_status in ["Pending", "PENDING"]):
            order.payment_status = "Paid"
            if not order.shipping_status or order.shipping_status != "DELIVERED":
                order.shipping_status = "DELIVERED"

    if status_in.payment_status:
        order.payment_status = status_in.payment_status

    db.commit()
    db.refresh(order)

    # Automatic AWB Generation on transition to Processing
    if new_status == "PROCESSING" and not order.awb_code:
        try:
            ShippingService.execute_automated_shipping_flow(order.id, db)
            db.refresh(order)
        except Exception as e:
            print(f"Warning: Could not auto-generate shipment on status change to Processing for Order #{order.order_number}: {e}")

    # Milestone Transactional Customer Email Notifications (orders@yuraebeauty.com)
    if new_status and new_status != old_status:
        try:
            from app.services.email_service import EmailService
            if new_status in ["PROCESSING", "PACKED"]:
                EmailService.send_order_packed(order)
            elif new_status in ["SHIPPED", "IN_TRANSIT"]:
                EmailService.send_shipping_notification(order)
            elif new_status in ["OUT_FOR_DELIVERY"]:
                EmailService.send_out_for_delivery(order)
            elif new_status in ["DELIVERED"]:
                EmailService.send_delivery_notification(order)
            elif new_status in ["CANCELLED", "CANCELED"]:
                EmailService.send_cancellation_email(order, "Order cancelled by store administrator")
        except Exception as email_err:
            print(f"Warning: Could not send status update email for Order #{order.order_number}: {email_err}")

    return order
