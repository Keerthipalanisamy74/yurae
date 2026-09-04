import json
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.models import (
    Order, OrderItem, Address, Product, Shipment,
    ShippingTrackingEvent, ShippingWebhookEvent, ShippingSetting
)
from app.services.exchange_rate_service import ExchangeRateService, CURRENCY_METADATA
from app.services.shipping_provider import get_shipping_provider, resolve_pincode_info

logger = logging.getLogger("yurae.shipping")

COUNTRY_CURRENCY_MAP: Dict[str, str] = {
    "India": "INR",
    "United States": "USD",
    "United States of America": "USD",
    "USA": "USD",
    "United Kingdom": "GBP",
    "UK": "GBP",
    "Germany": "EUR",
    "France": "EUR",
    "Italy": "EUR",
    "Spain": "EUR",
    "Netherlands": "EUR",
    "Canada": "CAD",
    "Australia": "AUD",
    "Singapore": "SGD",
    "Japan": "JPY",
    "United Arab Emirates": "AED",
    "UAE": "AED",
}

SHIPPING_ZONE_RULES: Dict[str, dict] = {
    "India": {
        "zone_name": "India Domestic Express",
        "estimated_delivery": "2-4 Business Days",
        "base_currency": "INR",
        "standard_fee": 99.0,
        "free_threshold": 1500.0,
    },
    "United States": {
        "zone_name": "North America (US)",
        "estimated_delivery": "4-7 Business Days",
        "base_currency": "USD",
        "standard_fee": 15.0,
        "free_threshold": 50.0,
    },
    "Canada": {
        "zone_name": "North America (Canada)",
        "estimated_delivery": "5-8 Business Days",
        "base_currency": "CAD",
        "standard_fee": 18.0,
        "free_threshold": 60.0,
    },
    "United Kingdom": {
        "zone_name": "United Kingdom Express",
        "estimated_delivery": "4-6 Business Days",
        "base_currency": "GBP",
        "standard_fee": 12.0,
        "free_threshold": 40.0,
    },
    "Europe": {
        "zone_name": "European Union Express",
        "estimated_delivery": "5-8 Business Days",
        "base_currency": "EUR",
        "standard_fee": 14.0,
        "free_threshold": 45.0,
    },
    "Australia": {
        "zone_name": "Australia & Oceania",
        "estimated_delivery": "5-8 Business Days",
        "base_currency": "AUD",
        "standard_fee": 20.0,
        "free_threshold": 70.0,
    },
    "Singapore": {
        "zone_name": "Southeast Asia (Singapore)",
        "estimated_delivery": "3-5 Business Days",
        "base_currency": "SGD",
        "standard_fee": 18.0,
        "free_threshold": 60.0,
    },
    "Japan": {
        "zone_name": "East Asia (Japan)",
        "estimated_delivery": "4-6 Business Days",
        "base_currency": "JPY",
        "standard_fee": 2000.0,
        "free_threshold": 7000.0,
    },
    "International": {
        "zone_name": "Rest of the World Express",
        "estimated_delivery": "7-12 Business Days",
        "base_currency": "USD",
        "standard_fee": 25.0,
        "free_threshold": 80.0,
    },
}

class ShippingService:
    """
    Core Shipping Service Orchestrator for Domestic India & Global International Logistics.
    Manages rate calculations, strict COD validation, automated carrier assignment,
    AWB and shipping label generation, pickup scheduling, tracking, and webhooks.
    """

    @classmethod
    def get_suggested_currency_for_country(cls, country: str) -> str:
        return COUNTRY_CURRENCY_MAP.get(country.strip(), "INR")

    @classmethod
    def validate_cod_eligibility(cls, country: str, is_cod: bool) -> bool:
        """
        Enforces strict COD validation:
        COD is allowed ONLY when destination country is India.
        """
        if not is_cod:
            return True
        c_clean = str(country or "").strip().lower()
        return c_clean in ["india", "in", "bharat"]

    @classmethod
    def get_setting_value(cls, key: str, default: Any, db: Optional[Session] = None) -> Any:
        if db:
            setting = db.query(ShippingSetting).filter(ShippingSetting.key == key).first()
            if setting and setting.value is not None:
                try:
                    return json.loads(setting.value)
                except Exception:
                    return setting.value
        return default

    @classmethod
    def calculate_shipping(
        cls,
        country: str,
        subtotal: float,
        target_currency: str = "INR",
        service_tier: str = "STANDARD",
        db: Optional[Session] = None
    ) -> Dict[str, Any]:
        """
        Authoritative server-side shipping rate calculator for checkout.
        """
        country_clean = country.strip() if country else "India"
        is_india = country_clean.lower() in ["india", "in"]

        if is_india:
            free_thresh = float(cls.get_setting_value("free_shipping_threshold", settings.DEFAULT_FREE_SHIPPING_THRESHOLD, db))
            flat_fee = float(cls.get_setting_value("flat_shipping_fee", settings.DEFAULT_FLAT_SHIPPING_FEE, db))
            express_surcharge = float(cls.get_setting_value("domestic_express_surcharge", settings.DEFAULT_DOMESTIC_EXPRESS_SURCHARGE, db))

            # Convert threshold to target currency if needed
            conv_thresh = ExchangeRateService.convert_amount(free_thresh, "INR", target_currency, db=db)
            conv_flat = ExchangeRateService.convert_amount(flat_fee, "INR", target_currency, db=db)
            conv_express = ExchangeRateService.convert_amount(express_surcharge, "INR", target_currency, db=db)

            is_free = subtotal >= conv_thresh and service_tier != "EXPRESS"
            final_fee = 0.0 if is_free else conv_flat
            if service_tier == "EXPRESS":
                final_fee += conv_express

            decimals = CURRENCY_METADATA.get(target_currency, {}).get("decimal_digits", 2)
            final_fee = round(final_fee, decimals if decimals > 0 else 0)

            return {
                "shipping_fee": final_fee,
                "is_free": is_free,
                "free_shipping_threshold": conv_thresh,
                "zone_name": "India Domestic Express",
                "estimated_delivery": "1-2 Business Days" if service_tier == "EXPRESS" else "2-4 Business Days",
                "currency": target_currency,
                "is_international": False
            }

        # International Shipping Calculation
        rule = SHIPPING_ZONE_RULES.get(country_clean, SHIPPING_ZONE_RULES.get("International"))
        base_fee = rule.get("standard_fee", settings.DEFAULT_INTERNATIONAL_FLAT_FEE_USD)
        base_thresh = rule.get("free_threshold", settings.DEFAULT_INTERNATIONAL_FREE_THRESHOLD_USD)
        rule_curr = rule.get("base_currency", "USD")

        # Convert to target currency
        conv_fee = ExchangeRateService.convert_amount(base_fee, rule_curr, target_currency, db=db)
        conv_thresh = ExchangeRateService.convert_amount(base_thresh, rule_curr, target_currency, db=db)
        conv_express_surcharge = ExchangeRateService.convert_amount(
            settings.DEFAULT_INTERNATIONAL_EXPRESS_SURCHARGE_USD, "USD", target_currency, db=db
        )

        is_free = subtotal >= conv_thresh and service_tier != "EXPRESS"
        final_fee = 0.0 if is_free else conv_fee
        if service_tier == "EXPRESS":
            final_fee += conv_express_surcharge

        decimals = CURRENCY_METADATA.get(target_currency, {}).get("decimal_digits", 2)
        final_fee = round(final_fee, decimals if decimals > 0 else 0)

        return {
            "shipping_fee": final_fee,
            "is_free": is_free,
            "free_shipping_threshold": conv_thresh,
            "zone_name": rule.get("zone_name", "International Express"),
            "estimated_delivery": "2-4 Business Days (Express Priority)" if service_tier == "EXPRESS" else rule.get("estimated_delivery", "5-8 Business Days"),
            "currency": target_currency,
            "is_international": True,
            "customs_notice": "International orders may be subject to import taxes and customs duties levied by destination authorities."
        }

    @classmethod
    def check_pincode_serviceability(
        cls,
        pincode: Optional[str] = None,
        postal_code: Optional[str] = None,
        country: str = "India",
        is_cod: bool = False,
        subtotal: float = 0.0,
        weight_kg: float = 0.45,
        length_cm: float = 15.0,
        breadth_cm: float = 10.0,
        height_cm: float = 8.0,
        service_tier: str = "STANDARD",
        currency: str = "INR",
        db: Optional[Session] = None
    ) -> Dict[str, Any]:
        """
        Multi-Region serviceability checker.
        Routes Indian PIN codes to Shiprocket and international postal codes to DHL / International provider.
        """
        country_name = country.strip() if country else "India"
        is_india = country_name.lower() in ["india", "in"]
        target_pin = str(pincode or postal_code or "").strip()

        # Reject COD for non-India
        if not is_india and is_cod:
            return {
                "pincode": target_pin,
                "country": country_name,
                "is_serviceable": False,
                "delivery_status_message": "Cash on Delivery (COD) is strictly unavailable for international destinations.",
                "estimated_delivery": "N/A",
                "shipping_fee": 0.0,
                "is_free": False,
                "free_shipping_threshold": 0.0,
                "available_couriers": [],
                "currency": currency,
                "is_international": True
            }

        # Basic format validation for India PIN
        if is_india and target_pin:
            clean_digits = target_pin.replace(" ", "")
            if not clean_digits.isdigit() or len(clean_digits) != 6:
                return {
                    "pincode": target_pin,
                    "country": "India",
                    "is_serviceable": False,
                    "delivery_status_message": "Invalid PIN code format. Please provide a 6-digit Indian PIN code.",
                    "estimated_delivery": "N/A",
                    "shipping_fee": 99.0,
                    "is_free": False,
                    "free_shipping_threshold": 1500.0,
                    "available_couriers": [],
                    "currency": "INR",
                    "is_international": False
                }

        provider = get_shipping_provider(country=country_name)
        pickup_pin = str(cls.get_setting_value("warehouse_pincode", settings.WAREHOUSE_PINCODE, db))

        res = provider.check_serviceability(
            delivery_pincode=target_pin,
            pickup_pincode=pickup_pin,
            weight_kg=weight_kg,
            is_cod=is_cod,
            subtotal=subtotal,
            country=country_name,
            dimensions={"length_cm": length_cm, "breadth_cm": breadth_cm, "height_cm": height_cm},
            service_tier=service_tier
        )

        return res

    @classmethod
    def calculate_order_package_metrics(cls, order: Order, db: Session) -> Dict[str, Any]:
        """
        Calculates aggregate weight, volumetric box dimensions, and international customs attributes.
        """
        total_weight = 0.0
        max_length = settings.DEFAULT_PACKAGE_LENGTH_CM
        max_breadth = settings.DEFAULT_PACKAGE_BREADTH_CM
        total_height = 0.0

        for item in order.items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if product:
                w = product.weight_kg or settings.DEFAULT_PACKAGE_WEIGHT_KG
                l = product.length_cm or settings.DEFAULT_PACKAGE_LENGTH_CM
                b = product.breadth_cm or settings.DEFAULT_PACKAGE_BREADTH_CM
                h = product.height_cm or settings.DEFAULT_PACKAGE_HEIGHT_CM
            else:
                w = settings.DEFAULT_PACKAGE_WEIGHT_KG
                l = settings.DEFAULT_PACKAGE_LENGTH_CM
                b = settings.DEFAULT_PACKAGE_BREADTH_CM
                h = settings.DEFAULT_PACKAGE_HEIGHT_CM

            total_weight += w * item.quantity
            max_length = max(max_length, l)
            max_breadth = max(max_breadth, b)
            total_height += h * min(item.quantity, 3)

        country = order.address.country if order.address else "India"
        is_intl = country.strip().lower() not in ["india", "in"]

        return {
            "weight_kg": max(0.2, round(total_weight, 2)),
            "length_cm": max(10.0, round(max_length, 1)),
            "breadth_cm": max(10.0, round(max_breadth, 1)),
            "height_cm": max(5.0, min(50.0, round(total_height, 1))),
            "is_international": is_intl,
            "destination_country": country,
            "customs_declared_value": round(order.subtotal, 2) if is_intl else None,
            "customs_currency": order.currency if is_intl else None,
            "customs_hs_code": "3304.99" if is_intl else None,
            "customs_description": "Luxury Cosmetics & Skincare Preparations" if is_intl else None
        }

    @classmethod
    def execute_automated_shipping_flow(cls, order_id: int, db: Session) -> Optional[Shipment]:
        """
        Automated Fulfillment Pipeline (Domestic & International):
        1. Checks payment status (Prepaid must be Paid; COD allowed ONLY for India).
        2. Routes order to appropriate shipping provider (Shiprocket or DHL).
        3. Creates shipment and order manifest.
        4. Assigns recommended courier & generates AWB.
        5. Generates shipping label and customs declaration.
        6. Schedules warehouse pickup.
        7. Records timeline event and updates order shipping status.
        """
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            logger.error(f"Order #{order_id} not found for shipping pipeline.")
            return None

        # Check if already processed
        if order.shipment and order.shipping_status in ["AWB_ASSIGNED", "PICKUP_SCHEDULED", "IN_TRANSIT", "DELIVERED"]:
            logger.info(f"Order #{order.order_number} already has active shipment {order.awb_code}.")
            return order.shipment

        address = order.address
        country = address.country if address else "India"
        is_india = country.strip().lower() in ["india", "in"]

        # Strict COD check: Reject COD if not India
        is_cod = bool(order.is_cod or (order.payments and order.payments[0].payment_method.upper() == "COD"))
        if is_cod and not is_india:
            err_msg = "Cash on Delivery (COD) is strictly disallowed for international destinations."
            order.shipping_status = "FAILED"
            order.shipping_error_log = err_msg
            db.commit()
            logger.error(f"Order #{order.order_number} failed shipping pipeline: {err_msg}")
            return None

        # Verify payment eligibility (Prepaid must be Paid; COD allowed as Pending for India only)
        if not is_cod and order.payment_status.upper() != "PAID":
            logger.warning(f"Skipping shipment creation for Order #{order.order_number}: payment status is {order.payment_status}")
            return None

        provider = get_shipping_provider(country=country)
        provider_name = "shiprocket" if is_india else "dhl_express"
        metrics = cls.calculate_order_package_metrics(order, db)

        try:
            # 1. Prepare Order Manifest Payload
            order_items_payload = []
            for itm in order.items:
                order_items_payload.append({
                    "name": itm.product_name,
                    "sku": f"YUR-{itm.product_id}",
                    "units": itm.quantity,
                    "selling_price": itm.price,
                    "discount": 0.0,
                    "tax": 0.0,
                    "hsn": "3304.99"
                })

            order_payload = {
                "order_id": order.order_number,
                "order_date": order.created_at.strftime("%Y-%m-%d %H:%M"),
                "pickup_location": settings.SHIPROCKET_PICKUP_LOCATION,
                "billing_customer_name": address.name if address else "Valued Client",
                "billing_last_name": "",
                "billing_address": address.address_line1 if address else "Main Address",
                "billing_address_2": address.address_line2 or "",
                "billing_city": address.city if address else "Bengaluru",
                "billing_pincode": address.postal_code if address else "560001",
                "billing_state": address.state if address else "Karnataka",
                "billing_country": country,
                "billing_email": order.user.email if order.user else "client@yuraebeauty.com",
                "billing_phone": address.phone if address else "+919876543210",
                "shipping_is_billing": True,
                "order_items": order_items_payload,
                "payment_method": "COD" if is_cod else "Prepaid",
                "shipping_charges": order.shipping_fee,
                "giftwrap_charges": 0,
                "transaction_charges": 0,
                "total_discount": order.discount,
                "sub_total": order.total_amount,
                "length": metrics["length_cm"],
                "breadth": metrics["breadth_cm"],
                "height": metrics["height_cm"],
                "weight": metrics["weight_kg"],
                "destination_country": country
            }

            # 2. Create Order in Provider System
            create_res = provider.create_order(order_payload)
            if not create_res.get("success"):
                raise RuntimeError(f"Provider failed to create order: {create_res.get('error', 'Unknown error')}")

            ext_order_id = create_res.get("order_id")
            ext_shipment_id = create_res.get("shipment_id", ext_order_id)

            # 3. Assign Courier Partner & Generate AWB
            awb_res = provider.assign_awb(ext_shipment_id)
            awb_code = awb_res.get("awb_code")
            courier_name = awb_res.get("courier_name", "Blue Dart Express Air" if is_india else "DHL Express Worldwide Priority")
            courier_id = awb_res.get("courier_id", 1 if is_india else 102)

            # 4. Generate Official Shipping Label & Customs Invoice
            label_res = provider.generate_label(ext_shipment_id)
            label_url = label_res.get("label_url")
            manifest_url = label_res.get("manifest_url")

            # 5. Request Warehouse Pickup
            pickup_res = provider.request_pickup(ext_shipment_id)
            pickup_token = pickup_res.get("pickup_token")
            pickup_date = pickup_res.get("pickup_date")

            # 6. Calculate Estimated Delivery Date
            if is_india:
                pin_info = resolve_pincode_info(address.postal_code if address else "560001")
                etd_str = pin_info["days"]
            else:
                etd_str = (datetime.utcnow() + timedelta(days=4)).strftime("%d %B %Y")

            tracking_url = awb_res.get("tracking_url") or (
                f"https://www.dhl.com/en/express/tracking.html?AWB={awb_code}" if not is_india
                else f"https://shiprocket.co/tracking/{awb_code}"
            )

            # 7. Persist or Update Shipment Record in Database
            shipment = order.shipment
            if not shipment:
                shipment = Shipment(
                    order_id=order.id,
                    provider=provider_name,
                    shipping_service_tier="STANDARD",
                    destination_country=country,
                    shipping_cost=order.shipping_fee,
                    external_order_id=str(ext_order_id),
                    external_shipment_id=str(ext_shipment_id),
                    awb_code=awb_code,
                    courier_id=courier_id,
                    courier_name=courier_name,
                    status="AWB_ASSIGNED",
                    weight_kg=metrics["weight_kg"],
                    length_cm=metrics["length_cm"],
                    breadth_cm=metrics["breadth_cm"],
                    height_cm=metrics["height_cm"],
                    label_url=label_url,
                    manifest_url=manifest_url,
                    pickup_token=pickup_token,
                    pickup_date=pickup_date,
                    estimated_delivery=etd_str,
                    customs_declared_value=metrics["customs_declared_value"],
                    customs_currency=metrics["customs_currency"],
                    customs_hs_code=metrics["customs_hs_code"],
                    customs_description=metrics["customs_description"]
                )
                db.add(shipment)
            else:
                shipment.provider = provider_name
                shipment.destination_country = country
                shipment.external_order_id = str(ext_order_id)
                shipment.external_shipment_id = str(ext_shipment_id)
                shipment.awb_code = awb_code
                shipment.courier_name = courier_name
                shipment.status = "AWB_ASSIGNED"
                shipment.label_url = label_url
                shipment.manifest_url = manifest_url
                shipment.pickup_token = pickup_token
                shipment.pickup_date = pickup_date
                shipment.estimated_delivery = etd_str
                shipment.customs_declared_value = metrics["customs_declared_value"]
                shipment.customs_currency = metrics["customs_currency"]

            # 8. Update Order Fields
            order.shipping_status = "AWB_ASSIGNED"
            order.shiprocket_order_id = str(ext_order_id)
            order.shiprocket_shipment_id = str(ext_shipment_id)
            order.awb_code = awb_code
            order.courier_name = courier_name
            order.courier_id = courier_id
            order.tracking_url = tracking_url
            order.shipping_label_url = label_url
            order.shipping_manifest_url = manifest_url
            order.pickup_token_number = pickup_token
            order.pickup_scheduled_date = pickup_date
            order.estimated_delivery_date = etd_str
            order.shipping_error_log = None

            # 9. Record Initial Timeline Events
            db.flush()
            
            ev1 = ShippingTrackingEvent(
                order_id=order.id,
                shipment_id=shipment.id,
                awb_code=awb_code,
                status="ORDER_CONFIRMED",
                activity=f"Order confirmed & luxury beauty package allocated at Atelier",
                location="Bengaluru Dispatch Atelier",
                event_time=datetime.utcnow()
            )
            db.add(ev1)

            ev2 = ShippingTrackingEvent(
                order_id=order.id,
                shipment_id=shipment.id,
                awb_code=awb_code,
                status="AWB_ASSIGNED",
                activity=f"Air Waybill {awb_code} generated for {courier_name}. Shipping label printed.",
                location="Bengaluru Fulfillment Centre",
                event_time=datetime.utcnow()
            )
            db.add(ev2)

            db.commit()
            db.refresh(shipment)
            db.refresh(order)

            # 10. Dispatch Shipment Dispatched Email with Live Tracking
            try:
                from app.services.email_service import EmailService
                EmailService.send_shipment_dispatched_email(order, {
                    "awb_code": awb_code,
                    "courier_name": courier_name,
                    "tracking_url": tracking_url
                })
            except Exception as email_ex:
                logger.warning(f"Could not dispatch shipment email for Order #{order.order_number}: {email_ex}")

            logger.info(f"Fulfillment completed for Order #{order.order_number} ({country}). Courier: {courier_name}, AWB: {awb_code}")
            return shipment

        except Exception as e:
            db.rollback()
            logger.error(f"Fulfillment flow error for Order #{order.order_number}: {e}", exc_info=True)
            order.shipping_status = "FAILED"
            order.shipping_error_log = str(e)
            db.commit()
            return None

    @classmethod
    def retry_shipment(cls, order_id: int, db: Session) -> Dict[str, Any]:
        """
        1-Click Retry for failed shipments.
        """
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            return {"success": False, "message": "Order not found."}

        shipment = cls.execute_automated_shipping_flow(order_id, db)
        if shipment:
            return {
                "success": True,
                "message": f"Shipment generated successfully! AWB: {shipment.awb_code}",
                "awb_code": shipment.awb_code,
                "courier_name": shipment.courier_name
            }
        else:
            return {
                "success": False,
                "message": f"Retry attempt failed: {order.shipping_error_log or 'Provider error'}"
            }

    @classmethod
    def process_webhook_event(cls, payload: Dict[str, Any], db: Session) -> Dict[str, Any]:
        """
        Idempotent webhook processor for shipping updates from Shiprocket or DHL/International providers.
        """
        awb = payload.get("awb") or payload.get("awb_code") or payload.get("tracking_number") or payload.get("waybill")
        current_status = (payload.get("current_status") or payload.get("status") or "").upper().strip()
        event_id = payload.get("event_id") or f"{awb or payload.get('order_id', 'EVT')}_{current_status}_{datetime.utcnow().strftime('%Y%m%d%H%M%S%f')}"
        provider_name = payload.get("provider", "shiprocket")

        # Deduplication check
        existing_event = db.query(ShippingWebhookEvent).filter(ShippingWebhookEvent.event_id == event_id).first()
        if existing_event:
            return {"success": True, "message": "Event already processed (idempotent duplicate skipped)."}

        # Store Webhook Log
        webhook_log = ShippingWebhookEvent(
            event_id=event_id,
            provider=provider_name,
            event_type=current_status,
            awb_code=awb,
            order_number=payload.get("order_id"),
            status=current_status,
            payload=json.dumps(payload),
            processed=True
        )
        db.add(webhook_log)

        # Match order by AWB or order number
        order = None
        if awb:
            order = db.query(Order).filter(Order.awb_code == awb).first()
        if not order and payload.get("order_id"):
            order = db.query(Order).filter(Order.order_number == payload.get("order_id")).first()

        if not order:
            db.commit()
            return {"success": True, "message": "Webhook logged (no matching order found in local database)."}

        # Map courier status to YURAE Order & Shipping Lifecycle
        status_mapping = {
            "PICKED UP": ("IN_TRANSIT", "Shipped"),
            "PICKED_UP": ("IN_TRANSIT", "Shipped"),
            "PICKUP COMPLETED": ("IN_TRANSIT", "Shipped"),
            "PICKUP_COMPLETED": ("IN_TRANSIT", "Shipped"),
            "PICKED": ("IN_TRANSIT", "Shipped"),
            "DISPATCHED": ("IN_TRANSIT", "Shipped"),
            "MANIFEST GENERATED": ("AWB_ASSIGNED", "Packed"),
            "MANIFEST_GENERATED": ("AWB_ASSIGNED", "Packed"),
            "IN TRANSIT": ("IN_TRANSIT", "Shipped"),
            "IN_TRANSIT": ("IN_TRANSIT", "Shipped"),
            "SHIPPED": ("IN_TRANSIT", "Shipped"),
            "REACHED AT DESTINATION": ("IN_TRANSIT", "Shipped"),
            "OUT FOR DELIVERY": ("OUT_FOR_DELIVERY", "Out for Delivery"),
            "OUT_FOR_DELIVERY": ("OUT_FOR_DELIVERY", "Out for Delivery"),
            "DELIVERED": ("DELIVERED", "Delivered"),
            "CANCELED": ("CANCELLED", "Cancelled"),
            "CANCELLED": ("CANCELLED", "Cancelled"),
            "RTO INITIATED": ("RTO", "Cancelled"),
            "RTO DELIVERED": ("RTO", "Cancelled"),
            "RTO_INITIATED": ("RTO", "Cancelled"),
            "RTO_DELIVERED": ("RTO", "Cancelled"),
        }

        old_order_status = order.order_status
        old_shipping_status = order.shipping_status
        mapped_shipping_status, mapped_order_status = status_mapping.get(current_status, (current_status, order.order_status))

        order.shipping_status = mapped_shipping_status
        order.order_status = mapped_order_status

        if mapped_shipping_status == "DELIVERED" and order.payment_status in ["Pending", "PENDING"]:
            order.payment_status = "Paid"

        # Record Tracking Event
        activity_msg = payload.get("activity") or f"Shipment status updated to {current_status}"
        location_msg = payload.get("location") or "Transit Hub"
        
        tracking_event = ShippingTrackingEvent(
            order_id=order.id,
            shipment_id=order.shipment.id if order.shipment else None,
            awb_code=awb,
            status=mapped_shipping_status,
            activity=activity_msg,
            location=location_msg,
            event_time=datetime.utcnow()
        )
        db.add(tracking_event)
        db.commit()
        db.refresh(order)

        # Real-time WebSocket Broadcast to Admin Dashboard & Customer Session
        try:
            from app.core.events import YuraeEventBus
            status_event_payload = {
                "order_id": order.id,
                "order_number": order.order_number,
                "old_status": old_order_status,
                "order_status": order.order_status,
                "payment_status": order.payment_status,
                "shipping_status": order.shipping_status,
                "tracking_url": order.tracking_url,
                "awb_code": order.awb_code,
                "courier_name": order.courier_name,
                "assigned_staff": order.assigned_staff,
                "priority": order.priority,
                "updated_at": datetime.utcnow().isoformat()
            }
            YuraeEventBus.publish("ORDER_STATUS_CHANGED", status_event_payload, target_user_id=order.user_id)
        except Exception as bus_ex:
            logger.warning(f"Could not broadcast status event: {bus_ex}")

        # Dispatch Transactional Milestone Emails on status progression
        if mapped_order_status != old_order_status:
            try:
                from app.services.email_service import EmailService
                if mapped_order_status.upper() == "SHIPPED":
                    EmailService.send_shipment_dispatched_email(order, {
                        "awb_code": order.awb_code,
                        "courier_name": order.courier_name,
                        "tracking_url": order.tracking_url
                    })
                elif mapped_order_status.upper() == "OUT FOR DELIVERY":
                    EmailService.send_out_for_delivery(order)
                elif mapped_order_status.upper() == "DELIVERED":
                    EmailService.send_delivery_notification(order)
            except Exception as email_ex:
                logger.warning(f"Could not send automated status email for Order #{order.order_number}: {email_ex}")

        logger.info(f"Webhook updated Order #{order.order_number} to {mapped_shipping_status} / {mapped_order_status}")
        return {"success": True, "message": f"Order #{order.order_number} updated to {mapped_shipping_status}"}

    @classmethod
    def validate_return_eligibility(cls, order: Order) -> Dict[str, Any]:
        """
        Enforces Yurae's 7-Day Luxury Return & Exchange Policy:
        - Order must be in 'Delivered' or 'Confirmed'/'Paid' status.
        - Request must be within 7 calendar days of delivery.
        """
        if not order:
            return {"eligible": False, "reason": "Order not found."}

        order_status = (order.order_status or "").upper()
        shipping_status = (order.shipping_status or "").upper()

        if order_status not in ["DELIVERED", "CONFIRMED", "SHIPPED"] and shipping_status not in ["DELIVERED"]:
            return {
                "eligible": False,
                "reason": f"Returns or exchanges can only be initiated on delivered orders (Current status: {order.order_status})."
            }

        # Calculate days elapsed since delivery or order creation
        reference_time = order.updated_at or order.created_at
        if reference_time:
            days_elapsed = (datetime.utcnow() - reference_time).days
            if days_elapsed > 7 and order_status == "DELIVERED":
                return {
                    "eligible": False,
                    "reason": f"The 7-day luxury return & exchange window expired {days_elapsed - 7} days ago."
                }

        return {
            "eligible": True,
            "reason": "Order is within the 7-day complimentary return & exchange window.",
            "policy": "YURAE 7-Day Guarantee: Free size exchanges or 100% refund."
        }

    @classmethod
    def create_return_request(
        cls,
        order: Order,
        user_id: int,
        request_type: str,
        reason: str,
        detailed_reason: Optional[str],
        preferred_exchange_size: Optional[str],
        refund_mode: Optional[str],
        items: Optional[List[Dict[str, Any]]],
        photos: Optional[List[str]],
        db: Session
    ) -> Any:
        from app.models.models import ReturnRequest
        import uuid

        eligibility = cls.validate_return_eligibility(order)
        if not eligibility["eligible"]:
            raise ValueError(eligibility["reason"])

        today_str = datetime.utcnow().strftime("%Y%m%d")
        req_num = f"RET-{today_str}-{uuid.uuid4().hex[:6].upper()}"

        photos_json = json.dumps(photos) if photos else None
        items_json = json.dumps(items) if items else None

        ret = ReturnRequest(
            request_number=req_num,
            order_id=order.id,
            user_id=user_id,
            request_type=request_type.upper(),
            reason=reason,
            detailed_reason=detailed_reason,
            preferred_exchange_size=preferred_exchange_size,
            refund_mode=refund_mode or "ORIGINAL_PAYMENT",
            status="PENDING_REVIEW",
            photos=photos_json,
            items_json=items_json
        )
        db.add(ret)
        db.commit()
        db.refresh(ret)
        return ret

