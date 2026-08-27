"""
Multi-Channel Enterprise Customer Notification Service (Email, SMS, WhatsApp)
Dispatches transaction updates and persists communication history into NotificationLog table.
"""

import logging
import uuid
from typing import Optional, Dict, Any, List
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.models import Order, User, NotificationLog
from app.services.email_service import EmailService

logger = logging.getLogger("yurae.notifications")


class NotificationService:
    @staticmethod
    def send_order_milestone_notification(
        order: Order,
        event_type: str,
        channel: str = "EMAIL",
        custom_message: Optional[str] = None,
        db: Optional[Session] = None
    ) -> Optional[NotificationLog]:
        """
        Dispatches milestone communications via Email / SMS / WhatsApp and logs record in DB.
        """
        recipient_email = order.user.email if order.user else (order.address.email if hasattr(order.address, "email") else None)
        recipient_phone = order.address.phone if order.address else (order.user.phone if order.user else None)
        recipient_name = order.address.name if order.address else (f"{order.user.first_name} {order.user.last_name}" if order.user else "Valued Patron")

        subject_map = {
            "PAYMENT_SUCCESS": f"✨ Payment Confirmed for Your Yurae Order #{order.order_number}",
            "ORDER_CONFIRMED": f"🌿 Order Confirmed #{order.order_number} • Preparing at Atelier",
            "PICK_LIST_GENERATED": f"📦 Atelier Pick List Generated for #{order.order_number}",
            "ITEMS_PICKED": f"🌿 Botanicals & Formulations Picked for #{order.order_number}",
            "QUALITY_CHECKED": f"💎 Quality Assurance Passed for Order #{order.order_number}",
            "PACKED": f"🎁 Order #{order.order_number} Packed with Luxury Care & Botanical Samples",
            "SHIPPED": f"🚚 Your Yurae Parcel #{order.order_number} is on the Way (AWB: {order.awb_code or 'Express Air'})",
            "OUT_FOR_DELIVERY": f"🛵 Out for Delivery Today: Order #{order.order_number}",
            "DELIVERED": f"✨ Delivered: Your Yurae Botanical Sanctuary #{order.order_number} has arrived!",
            "RETURN_APPROVED": f"🔄 Return / Exchange Approved for Order #{order.order_number}",
            "REFUND_PROCESSED": f"💰 Refund Processed for Order #{order.order_number}",
            "REVIEW_REQUEST": f"✨ How was your Yurae ritual? Share your thoughts on #{order.order_number}",
        }

        subject = subject_map.get(event_type, f"Order Update #{order.order_number} - {event_type.replace('_', ' ').title()}")
        preview_text = custom_message or f"Your order #{order.order_number} status is now {event_type.replace('_', ' ').title()}."

        # Email Dispatch
        if channel == "EMAIL" and recipient_email:
            try:
                if event_type == "SHIPPED":
                    EmailService.send_shipping_notification(
                        to_email=recipient_email,
                        order=order,
                        awb=getattr(order, 'awb_code', 'Pending'),
                        courier=getattr(order, 'courier_name', 'Blue Dart')
                    )
                elif event_type in ["ORDER_CONFIRMED", "PAYMENT_SUCCESS"]:
                    EmailService.send_order_confirmation(order)
                else:
                    EmailService.send_custom_email(
                        to_email=recipient_email,
                        subject=subject,
                        body_text=preview_text
                    )
            except Exception as e:
                logger.warning(f"Failed to dispatch email for {event_type}: {e}")

        # SMS / WhatsApp Simulation / Dispatch
        provider_msg_id = f"MSG-{uuid.uuid4().hex[:10].upper()}"
        if channel in ["SMS", "WHATSAPP"]:
            logger.info(f"[{channel} DISPATCH] To: {recipient_phone} | Msg: {preview_text}")

        # Persist Notification Log in Database
        if db:
            try:
                log = NotificationLog(
                    order_id=order.id,
                    user_id=order.user_id,
                    recipient_email=recipient_email,
                    recipient_phone=recipient_phone,
                    channel=channel.upper(),
                    event_type=event_type.upper(),
                    subject=subject,
                    payload_preview=preview_text,
                    status="SENT",
                    provider_message_id=provider_msg_id,
                    created_at=datetime.utcnow()
                )
                db.add(log)
                db.commit()
                db.refresh(log)
                return log
            except Exception as e:
                logger.error(f"Failed to persist NotificationLog: {e}")
                db.rollback()

        return None
