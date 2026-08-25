import json
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Header, Request, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.config import settings
from app.models.models import (
    Order, Address, User, Shipment, ShippingTrackingEvent,
    ShippingWebhookEvent, ShippingSetting
)
from app.schemas.schemas import (
    ServiceabilityRequest, ServiceabilityResponse, CourierOption,
    ShipmentResponse, ShippingTrackingEventResponse,
    TrackingResponse, AWBAssignRequest, PickupScheduleRequest,
    ShippingLabelResponse, ShippingSettingsResponse, ShippingSettingsUpdate
)
from app.api.deps import get_current_user, get_current_admin
from app.services.shipping_service import ShippingService
from app.services.shipping_provider import get_shipping_provider

logger = logging.getLogger("yurae.shipping")

router = APIRouter(prefix="/shipping", tags=["Shipping & Order Fulfillment"])

# ==========================================
# PUBLIC CLIENT ENDPOINTS
# ==========================================

@router.post("/serviceability", response_model=ServiceabilityResponse)
def check_shipping_serviceability(
    req_in: ServiceabilityRequest,
    db: Session = Depends(get_db)
):
    """
    Check if a destination (Indian PIN code or International Country/Postal Code) is serviceable,
    and calculate applicable rates, free delivery qualification, and transit times.
    """
    country = req_in.country or "India"
    pin = (req_in.pincode or req_in.postal_code or "").strip()

    res = ShippingService.check_pincode_serviceability(
        pincode=pin,
        postal_code=pin,
        country=country,
        is_cod=req_in.is_cod,
        subtotal=req_in.subtotal or 0.0,
        weight_kg=req_in.weight_kg or 0.45,
        length_cm=req_in.length_cm or 15.0,
        breadth_cm=req_in.breadth_cm or 10.0,
        height_cm=req_in.height_cm or 8.0,
        service_tier=req_in.service_tier or "STANDARD",
        currency=req_in.currency or "INR",
        db=db
    )

    courier_options = []
    for c in res.get("courier_options", []):
        courier_options.append(CourierOption(
            courier_id=c.get("courier_id", 1),
            courier_name=c.get("courier_name", "Express Carrier"),
            rate=float(c.get("rate", 0.0)),
            estimated_delivery_days=c.get("estimated_delivery_days", "2-4 Days"),
            etd=c.get("etd", "2-4 Days"),
            rating=float(c.get("rating", 4.8)),
            is_cod_available=bool(c.get("is_cod_available", True)),
            is_recommended=bool(c.get("is_recommended", False)),
            service_tier=c.get("service_tier", "STANDARD"),
            currency=c.get("currency", "INR")
        ))

    return ServiceabilityResponse(
        pincode=pin,
        postal_code=pin,
        country=country,
        city=res.get("city"),
        state=res.get("state"),
        is_serviceable=res.get("is_serviceable", False),
        delivery_status_message=res.get("delivery_status_message", "Delivery available"),
        estimated_delivery=res.get("estimated_delivery", "2-4 Business Days"),
        shipping_fee=float(res.get("shipping_fee", 0.0)),
        is_free=bool(res.get("is_free", False)),
        free_shipping_threshold=float(res.get("free_shipping_threshold", 1500.0)),
        recommended_courier=res.get("recommended_courier"),
        available_couriers=courier_options,
        currency=res.get("currency", "INR"),
        is_international=bool(res.get("is_international", False)),
        customs_notice=res.get("customs_notice")
    )


@router.get("/track/{identifier}", response_model=TrackingResponse)
def track_shipment_public(
    identifier: str,
    db: Session = Depends(get_db)
):
    """
    Public tracking endpoint for customers: query by Order Reference Number or AWB Code.
    Returns customer-safe tracking events without internal secrets.
    """
    clean_id = identifier.strip()
    order = db.query(Order).filter(
        (Order.order_number == clean_id) | (Order.awb_code == clean_id)
    ).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No active shipment found for '{clean_id}'. Please check your order reference number."
        )

    # Fetch live tracking events from DB
    events = db.query(ShippingTrackingEvent).filter(
        ShippingTrackingEvent.order_id == order.id
    ).order_by(ShippingTrackingEvent.event_time.desc()).all()

    # If no local events exist yet, generate default tracking step
    if not events and order.awb_code:
        provider = get_shipping_provider(country=order.address.country if order.address else "India")
        live_track = provider.get_tracking(order.awb_code)
        for ev in live_track.get("events", []):
            try:
                ev_time = datetime.fromisoformat(ev["event_time"])
            except Exception:
                ev_time = datetime.utcnow()

            db_ev = ShippingTrackingEvent(
                order_id=order.id,
                shipment_id=order.shipment.id if order.shipment else None,
                awb_code=order.awb_code,
                status=ev.get("status", "IN_TRANSIT"),
                activity=ev.get("activity", "In Transit"),
                location=ev.get("location", "Logistics Hub"),
                event_time=ev_time
            )
            db.add(db_ev)
        db.commit()
        events = db.query(ShippingTrackingEvent).filter(
            ShippingTrackingEvent.order_id == order.id
        ).order_by(ShippingTrackingEvent.event_time.desc()).all()

    tracking_events = [
        ShippingTrackingEventResponse(
            id=e.id,
            order_id=e.order_id,
            awb_code=e.awb_code,
            status=e.status,
            activity=e.activity,
            location=e.location,
            event_time=e.event_time
        )
        for e in events
    ]

    return TrackingResponse(
        order_number=order.order_number,
        awb_code=order.awb_code,
        courier_name=order.courier_name or "YURAE Express Logistics",
        current_status=order.order_status,
        shipping_status=order.shipping_status or "NOT_CREATED",
        estimated_delivery=order.estimated_delivery_date,
        tracking_url=order.tracking_url,
        pickup_date=order.pickup_scheduled_date,
        events=tracking_events
    )


# ==========================================
# WEBHOOK RECEIVER ENDPOINTS
# ==========================================

@router.post("/webhooks/shiprocket")
@router.post("/webhooks/shipping")
async def shiprocket_webhook(
    request: Request,
    x_shiprocket_token: Optional[str] = Header(None, alias="x-shiprocket-token"),
    x_webhook_secret: Optional[str] = Header(None, alias="x-webhook-secret"),
    db: Session = Depends(get_db)
):
    """
    Idempotent Webhook receiver for Shiprocket and International Logistics.
    Validates security tokens and updates shipment timeline automatically.
    """
    # Verify webhook token if configured in production
    expected_token = settings.SHIPROCKET_WEBHOOK_TOKEN
    universal_secret = settings.SHIPPING_WEBHOOK_SECRET
    
    if settings.SHIPPING_MODE.lower() == "production":
        provided = x_shiprocket_token or x_webhook_secret
        if provided and provided not in [expected_token, universal_secret]:
            logger.warning("Rejected unauthorized shipping webhook call.")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid webhook signature/token.")

    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload.")

    res = ShippingService.process_webhook_event(body, db)
    return res


# ==========================================
# ADMIN FULFILLMENT MANAGEMENT ENDPOINTS
# ==========================================

@router.get("/orders")
def get_admin_shipping_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    status_filter: Optional[str] = None,
    region: Optional[str] = None,  # DOMESTIC, INTERNATIONAL, ALL
    search: Optional[str] = None,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Admin: Retrieve all orders with shipping metadata, AWB codes, and courier statuses.
    Supports filtering by Region (Domestic vs International).
    """
    query = db.query(Order)

    if status_filter and status_filter.upper() != "ALL":
        query = query.filter(Order.shipping_status == status_filter.upper())

    if search:
        search_term = f"%{search.strip()}%"
        query = query.outerjoin(Address, Order.address_id == Address.id).filter(
            (Order.order_number.like(search_term)) |
            (Order.awb_code.like(search_term)) |
            (Order.courier_name.like(search_term)) |
            (Address.name.like(search_term)) |
            (Address.city.like(search_term))
        )

    orders = query.order_by(Order.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    total_count = query.count()

    results = []
    for ord in orders:
        addr = ord.address
        country = addr.country if addr else "India"
        is_intl = country.strip().lower() not in ["india", "in", "bharat"]

        if region:
            reg_upper = region.upper()
            if reg_upper == "DOMESTIC" and is_intl:
                continue
            if reg_upper == "INTERNATIONAL" and not is_intl:
                continue

        results.append({
            "id": ord.id,
            "order_number": ord.order_number,
            "created_at": ord.created_at,
            "customer_name": addr.name if addr else (f"{ord.user.first_name} {ord.user.last_name}" if ord.user else "Valued Client"),
            "customer_email": ord.user.email if ord.user else "client@yuraebeauty.com",
            "customer_phone": addr.phone if addr else "+919876543210",
            "destination_city": addr.city if addr else "Bengaluru",
            "destination_state": addr.state if addr else "Karnataka",
            "destination_pincode": addr.postal_code if addr else "560001",
            "destination_country": country,
            "is_international": is_intl,
            "total_amount": ord.total_amount,
            "currency": ord.currency,
            "payment_status": ord.payment_status,
            "payment_method": ord.payments[0].payment_method if ord.payments else ("COD" if ord.is_cod else "Online"),
            "is_cod": ord.is_cod,
            "order_status": ord.order_status,
            "shipping_status": ord.shipping_status or "NOT_CREATED",
            "awb_code": ord.awb_code,
            "courier_name": ord.courier_name,
            "tracking_url": ord.tracking_url,
            "shipping_label_url": ord.shipping_label_url,
            "pickup_scheduled_date": ord.pickup_scheduled_date,
            "pickup_token_number": ord.pickup_token_number,
            "shipping_error_log": ord.shipping_error_log,
            "items_count": len(ord.items)
        })

    return results


@router.post("/orders/{order_id}/create-shipment")
def manual_create_shipment(
    order_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Admin: Manually trigger shipment creation, AWB generation, and label download for an order.
    """
    shipment = ShippingService.execute_automated_shipping_flow(order_id, db)
    if not shipment:
        order = db.query(Order).filter(Order.id == order_id).first()
        err_msg = order.shipping_error_log if order else "Shipment creation failed."
        raise HTTPException(status_code=400, detail=f"Failed to create shipment: {err_msg}")

    return {
        "success": True,
        "message": f"Shipment created successfully for Order #{order_id}. AWB: {shipment.awb_code}",
        "awb_code": shipment.awb_code,
        "courier_name": shipment.courier_name,
        "label_url": shipment.label_url,
        "status": shipment.status
    }


@router.post("/orders/{order_id}/assign-awb")
def manual_assign_awb(
    order_id: int,
    req_in: Optional[AWBAssignRequest] = None,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Admin: Generate or reassign AWB tracking code.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    shipment_id = order.shiprocket_shipment_id or (order.shipment.external_shipment_id if order.shipment else None)
    if not shipment_id:
        raise HTTPException(status_code=400, detail="Shipment must be created before assigning AWB.")

    provider = get_shipping_provider(country=order.address.country if order.address else "India")
    awb_res = provider.assign_awb(shipment_id, courier_id=req_in.courier_id if req_in else None)

    if awb_res.get("success"):
        awb = awb_res.get("awb_code")
        courier_name = awb_res.get("courier_name", "Blue Dart Express")
        order.awb_code = awb
        order.courier_name = courier_name
        order.shipping_status = "AWB_ASSIGNED"
        if order.shipment:
            order.shipment.awb_code = awb
            order.shipment.courier_name = courier_name
            order.shipment.status = "AWB_ASSIGNED"
        db.commit()
        db.refresh(order)
        return {"success": True, "awb_code": awb, "courier_name": courier_name}
    else:
        raise HTTPException(status_code=400, detail="Failed to assign AWB with provider.")


@router.post("/orders/{order_id}/request-pickup")
def manual_request_pickup(
    order_id: int,
    req_in: Optional[PickupScheduleRequest] = None,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Admin: Schedule warehouse courier pickup.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    shipment_id = order.shiprocket_shipment_id or (order.shipment.external_shipment_id if order.shipment else None)
    if not shipment_id:
        raise HTTPException(status_code=400, detail="Shipment must be created before scheduling pickup.")

    pickup_date = req_in.pickup_date if req_in else None
    provider = get_shipping_provider(country=order.address.country if order.address else "India")
    pickup_res = provider.request_pickup(shipment_id, pickup_date=pickup_date)

    if pickup_res.get("success"):
        token = pickup_res.get("pickup_token")
        p_date = pickup_res.get("pickup_date")
        
        order.pickup_token_number = token
        order.pickup_scheduled_date = p_date
        order.shipping_status = "PICKUP_SCHEDULED"

        if order.shipment:
            order.shipment.pickup_token = token
            order.shipment.pickup_date = p_date
            order.shipment.status = "PICKUP_SCHEDULED"

        # Log tracking event
        ev = ShippingTrackingEvent(
            order_id=order.id,
            shipment_id=order.shipment.id if order.shipment else None,
            awb_code=order.awb_code,
            status="PICKUP_SCHEDULED",
            activity=f"Courier pickup scheduled for {p_date} (Token #{token})",
            location="Bengaluru Fulfillment Centre",
            event_time=datetime.utcnow()
        )
        db.add(ev)
        db.commit()
        db.refresh(order)

        return {
            "success": True,
            "message": f"Pickup scheduled for {p_date}. Pickup Token: {token}",
            "pickup_token": token,
            "pickup_date": p_date
        }
    else:
        raise HTTPException(status_code=400, detail="Failed to schedule courier pickup.")


@router.get("/orders/{order_id}/label", response_model=ShippingLabelResponse)
def get_shipping_label(
    order_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Admin: Fetch or generate official carrier shipping label PDF URL and customs invoice.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    if order.shipping_label_url:
        return ShippingLabelResponse(
            success=True,
            label_url=order.shipping_label_url,
            order_number=order.order_number,
            awb_code=order.awb_code,
            manifest_url=order.shipping_manifest_url
        )

    shipment_id = order.shiprocket_shipment_id or (order.shipment.external_shipment_id if order.shipment else None)
    if not shipment_id:
        raise HTTPException(status_code=400, detail="Shipment not created for this order yet.")

    provider = get_shipping_provider(country=order.address.country if order.address else "India")
    label_res = provider.generate_label(shipment_id)

    if label_res.get("success"):
        label_url = label_res.get("label_url")
        manifest_url = label_res.get("manifest_url")
        order.shipping_label_url = label_url
        order.shipping_manifest_url = manifest_url
        if order.shipment:
            order.shipment.label_url = label_url
            order.shipment.manifest_url = manifest_url
        db.commit()
        return ShippingLabelResponse(
            success=True,
            label_url=label_url,
            order_number=order.order_number,
            awb_code=order.awb_code,
            manifest_url=manifest_url
        )
    else:
        raise HTTPException(status_code=400, detail="Failed to generate shipping label from provider.")


@router.get("/orders/{order_id}/track", response_model=TrackingResponse)
def admin_track_shipment(
    order_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Admin: Live telemetry view for any order.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    events = db.query(ShippingTrackingEvent).filter(
        ShippingTrackingEvent.order_id == order.id
    ).order_by(ShippingTrackingEvent.event_time.desc()).all()

    tracking_events = [
        ShippingTrackingEventResponse(
            id=e.id,
            order_id=e.order_id,
            awb_code=e.awb_code,
            status=e.status,
            activity=e.activity,
            location=e.location,
            event_time=e.event_time
        )
        for e in events
    ]

    return TrackingResponse(
        order_number=order.order_number,
        awb_code=order.awb_code,
        courier_name=order.courier_name or "YURAE Logistics Partner",
        current_status=order.order_status,
        shipping_status=order.shipping_status or "NOT_CREATED",
        estimated_delivery=order.estimated_delivery_date,
        tracking_url=order.tracking_url,
        pickup_date=order.pickup_scheduled_date,
        events=tracking_events
    )


@router.post("/orders/{order_id}/cancel")
def admin_cancel_shipment(
    order_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Admin: Cancel courier shipment and release AWB.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    if not order.awb_code:
        raise HTTPException(status_code=400, detail="No active shipment/AWB exists to cancel.")

    provider = get_shipping_provider(country=order.address.country if order.address else "India")
    cancel_res = provider.cancel_shipment([order.awb_code])

    order.shipping_status = "CANCELLED"
    order.order_status = "Cancelled"
    if order.shipment:
        order.shipment.status = "CANCELLED"

    ev = ShippingTrackingEvent(
        order_id=order.id,
        shipment_id=order.shipment.id if order.shipment else None,
        awb_code=order.awb_code,
        status="CANCELLED",
        activity="Shipment cancelled by store administrator",
        location="Bengaluru Fulfillment Centre",
        event_time=datetime.utcnow()
    )
    db.add(ev)
    db.commit()

    return {"success": True, "message": f"Shipment for Order #{order.order_number} cancelled successfully."}


@router.post("/orders/{order_id}/retry")
def retry_failed_shipment(
    order_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Admin: 1-click retry for failed shipment creations.
    """
    result = ShippingService.retry_shipment(order_id, db)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("message"))
    return result


# ==========================================
# ADMIN SHIPPING SETTINGS ENDPOINTS
# ==========================================

@router.get("/settings", response_model=ShippingSettingsResponse)
def get_shipping_settings(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Admin: Retrieve shipping rates, threshold, warehouse address, and provider status.
    """
    provider = get_shipping_provider()
    is_connected = provider.is_live_configured() if hasattr(provider, "is_live_configured") else False

    return ShippingSettingsResponse(
        shipping_provider=settings.SHIPPING_PROVIDER,
        shipping_mode=settings.SHIPPING_MODE,
        cod_enabled=bool(ShippingService.get_setting_value("cod_enabled", settings.COD_ENABLED, db)),
        flat_shipping_fee=float(ShippingService.get_setting_value("flat_shipping_fee", settings.DEFAULT_FLAT_SHIPPING_FEE, db)),
        free_shipping_threshold=float(ShippingService.get_setting_value("free_shipping_threshold", settings.DEFAULT_FREE_SHIPPING_THRESHOLD, db)),
        cod_surcharge=float(ShippingService.get_setting_value("cod_surcharge", settings.DEFAULT_COD_SURCHARGE, db)),
        default_package_weight_kg=float(ShippingService.get_setting_value("default_package_weight_kg", settings.DEFAULT_PACKAGE_WEIGHT_KG, db)),
        default_package_length_cm=float(ShippingService.get_setting_value("default_package_length_cm", settings.DEFAULT_PACKAGE_LENGTH_CM, db)),
        default_package_breadth_cm=float(ShippingService.get_setting_value("default_package_breadth_cm", settings.DEFAULT_PACKAGE_BREADTH_CM, db)),
        default_package_height_cm=float(ShippingService.get_setting_value("default_package_height_cm", settings.DEFAULT_PACKAGE_HEIGHT_CM, db)),
        warehouse_contact_name=str(ShippingService.get_setting_value("warehouse_contact_name", settings.WAREHOUSE_CONTACT_NAME, db)),
        warehouse_email=str(ShippingService.get_setting_value("warehouse_email", settings.WAREHOUSE_EMAIL, db)),
        warehouse_phone=str(ShippingService.get_setting_value("warehouse_phone", settings.WAREHOUSE_PHONE, db)),
        warehouse_address=str(ShippingService.get_setting_value("warehouse_address", settings.WAREHOUSE_ADDRESS, db)),
        warehouse_address_2=str(ShippingService.get_setting_value("warehouse_address_2", settings.WAREHOUSE_ADDRESS_2, db)),
        warehouse_city=str(ShippingService.get_setting_value("warehouse_city", settings.WAREHOUSE_CITY, db)),
        warehouse_state=str(ShippingService.get_setting_value("warehouse_state", settings.WAREHOUSE_STATE, db)),
        warehouse_pincode=str(ShippingService.get_setting_value("warehouse_pincode", settings.WAREHOUSE_PINCODE, db)),
        warehouse_country=str(ShippingService.get_setting_value("warehouse_country", settings.WAREHOUSE_COUNTRY, db)),
        is_shiprocket_connected=is_connected
    )


@router.put("/settings", response_model=ShippingSettingsResponse)
def update_shipping_settings(
    update_in: ShippingSettingsUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Admin: Update shipping rates, free shipping threshold, and warehouse address.
    """
    update_dict = update_in.model_dump(exclude_unset=True)
    for k, v in update_dict.items():
        if v is not None:
            existing = db.query(ShippingSetting).filter(ShippingSetting.key == k).first()
            if existing:
                existing.value = json.dumps(v) if isinstance(v, (dict, list, bool)) else str(v)
            else:
                new_s = ShippingSetting(
                    key=k,
                    value=json.dumps(v) if isinstance(v, (dict, list, bool)) else str(v)
                )
                db.add(new_s)

    db.commit()
    return get_shipping_settings(current_admin, db)
