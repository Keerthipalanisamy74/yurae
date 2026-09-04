"""
Yurae Beauty — Production Enterprise Transactional Email Service
Supports domain-level email routing for yuraebeauty.com with asynchronous background processing,
header injection defense, robust SMTP retry mechanics, and SQL audit logging (EmailLog).
"""

import re
import os
import smtplib
import logging
import threading
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr
from datetime import datetime
from typing import Optional, Dict, Any, List
from pathlib import Path
from dotenv import dotenv_values

from app.core.config import settings
from app.services.email_templates import (
    render_welcome_email,
    render_otp_email,
    render_password_reset_confirmation,
    render_order_confirmation,
    render_order_packed,
    render_order_shipped,
    render_out_for_delivery,
    render_order_delivered,
    render_order_cancelled,
    render_refund_notification,
    render_contact_acknowledgement,
    render_contact_reply,
    render_admin_order_alert,
    render_admin_contact_alert,
    render_back_in_stock_alert
)

logger = logging.getLogger("yurae.email")


class EmailService:
    @classmethod
    def get_smtp_config(cls) -> Dict[str, Any]:
        """
        Dynamically reads freshest SMTP credentials and domain sender configuration from disk,
        with intelligent provider auto-detection (e.g. Brevo vs Gmail).
        """
        env_file = Path(__file__).resolve().parent.parent.parent / ".env"
        file_cfg = {}
        if env_file.exists():
            try:
                from dotenv import dotenv_values
                file_cfg = dotenv_values(env_file)
            except Exception:
                pass

        def get_val(key: str, default: str = "") -> str:
            raw = file_cfg.get(key) or os.getenv(key, getattr(settings, key, default))
            if raw is None:
                return default
            val = str(raw).strip()
            # Strip enclosing quotes if present
            if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
                val = val[1:-1].strip()
            return val

        mode = get_val("EMAIL_SERVICE_MODE", "smtp").lower()
        host = get_val("SMTP_HOST", "smtp.gmail.com")
        port_raw = get_val("SMTP_PORT", "587")
        try:
            port = int(port_raw)
        except ValueError:
            port = 587
            
        username = get_val("SMTP_USERNAME") or get_val("SMTP_USER") or "orders@yuraebeauty.com"
        password = get_val("SMTP_PASSWORD", "")
        
        # Smart Auto-Detection: Detect Brevo SMTP Master Key
        if password.startswith("xsmtpsib-") and host in ("smtp.gmail.com", "localhost", "127.0.0.1", ""):
            host = "smtp-relay.brevo.com"
            port = 587

        use_tls = get_val("SMTP_USE_TLS", "true").lower() in ("true", "1", "yes")
        use_ssl = get_val("SMTP_USE_SSL", "false").lower() in ("true", "1", "yes") or port == 465
        if port == 465:
            use_ssl = True
            use_tls = False
        elif port == 587:
            use_tls = True
            use_ssl = False

        timeout = int(get_val("SMTP_TIMEOUT_SECONDS", "15") or 15)

        brand_name = get_val("EMAIL_FROM_NAME", "Yurae Beauty")
        sender_email = get_val("SMTP_SENDER_EMAIL") or get_val("EMAIL_SENDER_EMAIL") or get_val("VERIFIED_SENDER_EMAIL") or "pkiruthika101@gmail.com"
        from_support = get_val("EMAIL_FROM_SUPPORT", "support@yuraebeauty.com")
        from_orders = get_val("EMAIL_FROM_ORDERS", "orders@yuraebeauty.com")
        from_noreply = get_val("EMAIL_FROM_NOREPLY", "noreply@yuraebeauty.com")
        from_admin = get_val("EMAIL_FROM_ADMIN", "admin@yuraebeauty.com")
        from_marketing = get_val("EMAIL_FROM_MARKETING", "marketing@yuraebeauty.com")
        frontend_url = get_val("FRONTEND_URL", "https://yuraebeauty.com")

        return {
            "mode": mode,
            "host": host,
            "port": port,
            "username": username,
            "password": password,
            "sender_email": sender_email,
            "use_tls": use_tls,
            "use_ssl": use_ssl,
            "timeout": timeout,
            "brand_name": brand_name,
            "from_support": from_support,
            "from_orders": from_orders,
            "from_noreply": from_noreply,
            "from_admin": from_admin,
            "from_marketing": from_marketing,
            "frontend_url": frontend_url.rstrip("/"),
        }

    @staticmethod
    def sanitize_header(val: Optional[str]) -> str:
        """Prevents SMTP header injection attacks by stripping newline and carriage return characters."""
        if not val:
            return ""
        return re.sub(r'[\r\n]+', ' ', str(val)).strip()

    @staticmethod
    def is_valid_email(email: str) -> bool:
        """Validates basic email structure."""
        if not email or "@" not in email:
            return False
        return bool(re.match(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$", email.strip()))

    @classmethod
    def _persist_email_log(
        cls,
        recipient: str,
        sender: str,
        sender_name: str,
        subject: str,
        template_name: str,
        status: str,
        error_message: Optional[str] = None,
        related_order_id: Optional[int] = None,
        related_user_id: Optional[int] = None,
        html_content: Optional[str] = None
    ) -> None:
        """Safely saves record in email_logs table without failing caller."""
        try:
            from app.database.session import SessionLocal
            from app.models.models import EmailLog

            db = SessionLocal()
            try:
                log_entry = EmailLog(
                    recipient_email=recipient,
                    sender_email=sender,
                    sender_name=sender_name,
                    subject=subject,
                    template_name=template_name,
                    status=status,
                    error_message=error_message,
                    related_order_id=related_order_id,
                    related_user_id=related_user_id,
                    html_content=html_content[:4000] if html_content else None,
                    created_at=datetime.utcnow()
                )
                db.add(log_entry)
                db.commit()
            finally:
                db.close()
        except Exception as log_err:
            logger.warning(f"Could not persist EmailLog: {log_err}")

    @classmethod
    def _send_email_sync(
        cls,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
        sender_role: str = "noreply",
        template_name: str = "GENERIC",
        related_order_id: Optional[int] = None,
        related_user_id: Optional[int] = None
    ) -> bool:
        """
        Executes synchronous SMTP transmission with delivery logging and robust provider compliance.
        """
        clean_to = cls.sanitize_header(to_email).lower()
        clean_subject = cls.sanitize_header(subject)

        if not cls.is_valid_email(clean_to):
            logger.warning(f"[EMAIL ABORTED] Invalid recipient email address: {clean_to}")
            cls._persist_email_log(clean_to, "invalid", "Yurae", clean_subject, template_name, "FAILED", "Invalid recipient address", related_order_id, related_user_id)
            return False

        config = cls.get_smtp_config()
        brand_name = config["brand_name"]

        # Sender role mapping
        sender_map = {
            "support": (config["from_support"], f"{brand_name} Support"),
            "orders": (config["from_orders"], f"{brand_name} Orders"),
            "noreply": (config["from_noreply"], f"{brand_name}"),
            "admin": (config["from_admin"], f"{brand_name} System"),
            "marketing": (config["from_marketing"], f"{brand_name} Concierge"),
        }
        role_email, display_name = sender_map.get(sender_role, (config["from_noreply"], brand_name))

        # Check simulation mode or missing password
        if config["mode"] == "console" or not config["password"]:
            clean_preview = (text_content or clean_subject).encode('ascii', 'ignore').decode('ascii')
            print(f"\n[EMAIL DISPATCH - SIMULATION MODE ({sender_role.upper()})]")
            print(f"  To: {clean_to}")
            print(f"  From: {display_name} <{role_email}>")
            print(f"  Subject: {clean_subject}")
            print(f"  Preview: {clean_preview[:160]}...")
            print("  -----------------------------------------------\n")
            cls._persist_email_log(clean_to, role_email, display_name, clean_subject, template_name, "SIMULATED", None, related_order_id, related_user_id, html_content)
            return True

        try:
            from email.header import Header
            msg = MIMEMultipart("alternative")
            msg["Subject"] = Header(clean_subject, "utf-8")
            
            # Determine effective physical sender for SMTP envelope and From header
            # For Brevo / Gmail: Brevo's username (b6e888001@smtp-brevo.com) is NOT an inbox.
            # Brevo requires a verified sender email address on the account (e.g. pkiruthika101@gmail.com).
            verified_sender = config.get("sender_email") or "pkiruthika101@gmail.com"
            auth_user = config.get("username", "")
            
            if "brevo" in config.get("host", "").lower() or "sendinblue" in config.get("host", "").lower():
                from_addr = verified_sender
                envelope_sender = verified_sender
            elif "gmail" in config.get("host", "").lower():
                from_addr = auth_user if ("@" in auth_user and not auth_user.endswith("@smtp-brevo.com")) else verified_sender
                envelope_sender = from_addr
            else:
                from_addr = role_email if ("@" in role_email) else verified_sender
                envelope_sender = from_addr

            msg["From"] = formataddr((display_name, from_addr))
            msg["To"] = clean_to
            msg["Reply-To"] = role_email if ("@" in role_email and role_email != from_addr) else config.get("from_support", "support@yuraebeauty.com")
            msg["Date"] = datetime.utcnow().strftime("%a, %d %b %Y %H:%M:%S +0000")

            if text_content:
                msg.attach(MIMEText(text_content, "plain", "utf-8"))
            msg.attach(MIMEText(html_content, "html", "utf-8"))

            if config["use_ssl"]:
                with smtplib.SMTP_SSL(config["host"], config["port"], timeout=config["timeout"]) as server:
                    server.login(config["username"], config["password"])
                    server.send_message(msg, from_addr=envelope_sender, to_addrs=[clean_to])
            else:
                with smtplib.SMTP(config["host"], config["port"], timeout=config["timeout"]) as server:
                    if config["use_tls"]:
                        server.starttls()
                    server.login(config["username"], config["password"])
                    server.send_message(msg, from_addr=envelope_sender, to_addrs=[clean_to])

            logger.info(f"[EMAIL SUCCESS] Delivered to {clean_to} via {config['host']} (Template: {template_name})")
            print(f"[EMAIL SUCCESS] Real-time email dispatched to {clean_to} (From: {display_name} <{from_addr}>)")
            cls._persist_email_log(clean_to, from_addr, display_name, clean_subject, template_name, "SENT", None, related_order_id, related_user_id, html_content)
            return True

        except Exception as exc:
            err_msg = str(exc)
            logger.error(f"[EMAIL FAILED] Could not dispatch to {clean_to}: {err_msg}")
            print(f"[EMAIL ERROR] Failed to send email to {clean_to}: {err_msg}")
            cls._persist_email_log(clean_to, role_email, display_name, clean_subject, template_name, "FAILED", err_msg, related_order_id, related_user_id, html_content)
            return False

    @classmethod
    def _send_async(
        cls,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
        sender_role: str = "noreply",
        template_name: str = "GENERIC",
        related_order_id: Optional[int] = None,
        related_user_id: Optional[int] = None
    ) -> None:
        """
        Dispatches email asynchronously in a non-blocking daemon thread
        so HTTP responses return instantaneously to the user.
        """
        t = threading.Thread(
            target=cls._send_email_sync,
            args=(to_email, subject, html_content, text_content, sender_role, template_name, related_order_id, related_user_id),
            daemon=True
        )
        t.start()

    # ==========================================================================
    # 🌸 PUBLIC HIGH-LEVEL TRANSACTIONAL EMAIL METHODS
    # ==========================================================================

    @classmethod
    def send_welcome_email(cls, user: Any) -> None:
        """Sends welcome onboarding email to customer from noreply@yuraebeauty.com."""
        if not getattr(user, 'email', None):
            return
        cfg = cls.get_smtp_config()
        rendered = render_welcome_email(user, cfg["frontend_url"])
        cls._send_async(
            to_email=user.email,
            subject=rendered["subject"],
            html_content=rendered["html"],
            text_content=rendered["text"],
            sender_role="noreply",
            template_name="WELCOME_REGISTRATION",
            related_user_id=getattr(user, 'id', None)
        )

    @classmethod
    def send_otp_email(
        cls,
        to_email: str,
        first_name: str,
        otp: str,
        purpose: str = "Security Verification",
        expires_minutes: int = 15
    ) -> None:
        """Sends time-limited OTP code from noreply@yuraebeauty.com."""
        cfg = cls.get_smtp_config()
        rendered = render_otp_email(first_name, otp, purpose, expires_minutes, cfg["frontend_url"])
        cls._send_async(
            to_email=to_email,
            subject=rendered["subject"],
            html_content=rendered["html"],
            text_content=rendered["text"],
            sender_role="noreply",
            template_name="OTP_VERIFICATION"
        )

    @classmethod
    def send_password_reset_otp(cls, to_email: str, first_name: str, otp: str) -> None:
        """Backwards-compatible wrapper for password reset OTP."""
        cls.send_otp_email(to_email, first_name, otp, "Password Reset Request", 15)

    @classmethod
    def send_password_changed_email(cls, to_email: str, first_name: str) -> None:
        """Sends security alert after password reset from noreply@yuraebeauty.com."""
        cfg = cls.get_smtp_config()
        rendered = render_password_reset_confirmation(first_name, cfg["frontend_url"])
        cls._send_async(
            to_email=to_email,
            subject=rendered["subject"],
            html_content=rendered["html"],
            text_content=rendered["text"],
            sender_role="noreply",
            template_name="PASSWORD_CHANGED"
        )

    @classmethod
    def send_order_confirmation(cls, order: Any, user: Optional[Any] = None) -> None:
        """Sends itemized luxury receipt from orders@yuraebeauty.com."""
        buyer_user = user or getattr(order, 'user', None)
        to_email = getattr(order, 'shipping_email', None) or (buyer_user.email if buyer_user else None)
        if not to_email:
            return
        cfg = cls.get_smtp_config()
        rendered = render_order_confirmation(order, buyer_user, cfg["frontend_url"])
        cls._send_async(
            to_email=to_email,
            subject=rendered["subject"],
            html_content=rendered["html"],
            text_content=rendered["text"],
            sender_role="orders",
            template_name="ORDER_CONFIRMATION",
            related_order_id=getattr(order, 'id', None),
            related_user_id=getattr(order, 'user_id', None)
        )

    @classmethod
    def send_order_confirmation_email(cls, order: Any, user: Optional[Any] = None) -> None:
        """Backwards-compatible alias for send_order_confirmation."""
        cls.send_order_confirmation(order, user)

    @classmethod
    def send_order_packed(cls, order: Any, user: Optional[Any] = None) -> None:
        """Sends order packed notification from orders@yuraebeauty.com."""
        buyer_user = user or getattr(order, 'user', None)
        to_email = getattr(order, 'shipping_email', None) or (buyer_user.email if buyer_user else None)
        if not to_email:
            return
        cfg = cls.get_smtp_config()
        rendered = render_order_packed(order, buyer_user, cfg["frontend_url"])
        cls._send_async(
            to_email=to_email,
            subject=rendered["subject"],
            html_content=rendered["html"],
            text_content=rendered["text"],
            sender_role="orders",
            template_name="ORDER_PACKED",
            related_order_id=getattr(order, 'id', None),
            related_user_id=getattr(order, 'user_id', None)
        )

    @classmethod
    def send_shipping_notification(
        cls,
        order: Any,
        tracking_info: Optional[Dict[str, Any]] = None,
        user: Optional[Any] = None,
        to_email: Optional[str] = None
    ) -> None:
        """Sends courier tracking and waybill notification from orders@yuraebeauty.com."""
        buyer_user = user or getattr(order, 'user', None)
        recipient = to_email or getattr(order, 'shipping_email', None) or (buyer_user.email if buyer_user else None)
        if not recipient:
            return
        cfg = cls.get_smtp_config()
        rendered = render_order_shipped(order, tracking_info, buyer_user, cfg["frontend_url"])
        cls._send_async(
            to_email=recipient,
            subject=rendered["subject"],
            html_content=rendered["html"],
            text_content=rendered["text"],
            sender_role="orders",
            template_name="ORDER_SHIPPED",
            related_order_id=getattr(order, 'id', None),
            related_user_id=getattr(order, 'user_id', None)
        )

    @classmethod
    def send_shipment_dispatched_email(cls, order: Any, tracking_info: Dict[str, Any]) -> None:
        """Backwards-compatible alias for send_shipping_notification."""
        cls.send_shipping_notification(order, tracking_info)

    @classmethod
    def send_out_for_delivery(
        cls,
        order: Any,
        tracking_info: Optional[Dict[str, Any]] = None,
        user: Optional[Any] = None
    ) -> None:
        """Sends out-for-delivery notification from orders@yuraebeauty.com."""
        buyer_user = user or getattr(order, 'user', None)
        to_email = getattr(order, 'shipping_email', None) or (buyer_user.email if buyer_user else None)
        if not to_email:
            return
        cfg = cls.get_smtp_config()
        rendered = render_out_for_delivery(order, tracking_info, buyer_user, cfg["frontend_url"])
        cls._send_async(
            to_email=to_email,
            subject=rendered["subject"],
            html_content=rendered["html"],
            text_content=rendered["text"],
            sender_role="orders",
            template_name="OUT_FOR_DELIVERY",
            related_order_id=getattr(order, 'id', None),
            related_user_id=getattr(order, 'user_id', None)
        )

    @classmethod
    def send_delivery_notification(cls, order: Any, user: Optional[Any] = None) -> None:
        """Sends delivery confirmation from orders@yuraebeauty.com."""
        buyer_user = user or getattr(order, 'user', None)
        to_email = getattr(order, 'shipping_email', None) or (buyer_user.email if buyer_user else None)
        if not to_email:
            return
        cfg = cls.get_smtp_config()
        rendered = render_order_delivered(order, buyer_user, cfg["frontend_url"])
        cls._send_async(
            to_email=to_email,
            subject=rendered["subject"],
            html_content=rendered["html"],
            text_content=rendered["text"],
            sender_role="orders",
            template_name="ORDER_DELIVERED",
            related_order_id=getattr(order, 'id', None),
            related_user_id=getattr(order, 'user_id', None)
        )

    @classmethod
    def send_cancellation_email(cls, order: Any, reason: Optional[str] = None, user: Optional[Any] = None) -> None:
        """Sends order cancellation notification from orders@yuraebeauty.com."""
        buyer_user = user or getattr(order, 'user', None)
        to_email = getattr(order, 'shipping_email', None) or (buyer_user.email if buyer_user else None)
        if not to_email:
            return
        cfg = cls.get_smtp_config()
        rendered = render_order_cancelled(order, reason, buyer_user, cfg["frontend_url"])
        cls._send_async(
            to_email=to_email,
            subject=rendered["subject"],
            html_content=rendered["html"],
            text_content=rendered["text"],
            sender_role="orders",
            template_name="ORDER_CANCELLED",
            related_order_id=getattr(order, 'id', None),
            related_user_id=getattr(order, 'user_id', None)
        )

    @classmethod
    def send_refund_email(cls, order: Any, refund_record: Any, user: Optional[Any] = None) -> None:
        """Sends refund completion receipt from orders@yuraebeauty.com."""
        buyer_user = user or getattr(order, 'user', None)
        to_email = getattr(order, 'shipping_email', None) or (buyer_user.email if buyer_user else None)
        if not to_email:
            return
        cfg = cls.get_smtp_config()
        rendered = render_refund_notification(order, refund_record, buyer_user, cfg["frontend_url"])
        cls._send_async(
            to_email=to_email,
            subject=rendered["subject"],
            html_content=rendered["html"],
            text_content=rendered["text"],
            sender_role="orders",
            template_name="REFUND_ISSUED",
            related_order_id=getattr(order, 'id', None),
            related_user_id=getattr(order, 'user_id', None)
        )

    @classmethod
    def send_contact_acknowledgement(cls, contact_message: Any) -> None:
        """Sends confirmation receipt for customer inquiry from support@yuraebeauty.com."""
        if not getattr(contact_message, 'email', None):
            return
        cfg = cls.get_smtp_config()
        rendered = render_contact_acknowledgement(contact_message, cfg["frontend_url"])
        cls._send_async(
            to_email=contact_message.email,
            subject=rendered["subject"],
            html_content=rendered["html"],
            text_content=rendered["text"],
            sender_role="support",
            template_name="CONTACT_ACKNOWLEDGEMENT"
        )

    @classmethod
    def send_contact_reply(cls, contact_message: Any, reply_text: str) -> None:
        """Sends concierge response email directly to the customer from support@yuraebeauty.com."""
        if not getattr(contact_message, 'email', None):
            return
        cfg = cls.get_smtp_config()
        rendered = render_contact_reply(contact_message, reply_text, cfg["frontend_url"])
        cls._send_async(
            to_email=contact_message.email,
            subject=rendered["subject"],
            html_content=rendered["html"],
            text_content=rendered["text"],
            sender_role="support",
            template_name="CONTACT_REPLY"
        )

    @classmethod
    def send_admin_order_notification(cls, order: Any, user: Optional[Any] = None) -> None:
        """Sends store alert to admin@yuraebeauty.com on new order placement."""
        cfg = cls.get_smtp_config()
        admin_email = cfg["from_admin"]
        rendered = render_admin_order_alert(order, user, f"{cfg['frontend_url']}/admin")
        cls._send_async(
            to_email=admin_email,
            subject=rendered["subject"],
            html_content=rendered["html"],
            text_content=rendered["text"],
            sender_role="admin",
            template_name="ADMIN_NEW_ORDER_ALERT",
            related_order_id=getattr(order, 'id', None)
        )

    @classmethod
    def send_admin_new_order_alert_email(cls, order: Any, user: Optional[Any] = None) -> None:
        """Backwards-compatible alias for send_admin_order_notification."""
        cls.send_admin_order_notification(order, user)

    @classmethod
    def send_admin_contact_alert(cls, contact_message: Any) -> None:
        """Sends customer inquiry notification to admin@yuraebeauty.com."""
        cfg = cls.get_smtp_config()
        admin_email = cfg["from_admin"]
        rendered = render_admin_contact_alert(contact_message, f"{cfg['frontend_url']}/admin")
        cls._send_async(
            to_email=admin_email,
            subject=rendered["subject"],
            html_content=rendered["html"],
            text_content=rendered["text"],
            sender_role="admin",
            template_name="ADMIN_CONTACT_ALERT"
        )

    @classmethod
    def send_back_in_stock_email(
        cls,
        to_email: str,
        product_name: str,
        variant_value: Optional[str] = None,
        product_url: Optional[str] = None
    ) -> None:
        """Sends restock announcement to customer from marketing@yuraebeauty.com."""
        cfg = cls.get_smtp_config()
        rendered = render_back_in_stock_alert(product_name, variant_value, product_url, cfg["frontend_url"])
        cls._send_async(
            to_email=to_email,
            subject=rendered["subject"],
            html_content=rendered["html"],
            text_content=rendered["text"],
            sender_role="marketing",
            template_name="BACK_IN_STOCK_ALERT"
        )

    @classmethod
    def send_stock_notification_registered_email(cls, to_email: str, product_name: str, variant_value: Optional[str] = None) -> None:
        """Sends confirmation when user signs up for restock notifications."""
        cls.send_back_in_stock_email(to_email, product_name, variant_value)

    @classmethod
    def send_back_in_stock_alert(cls, to_email: str, product_name: str, variant_value: Optional[str] = None, product_url: Optional[str] = None) -> None:
        """Alias for send_back_in_stock_email."""
        cls.send_back_in_stock_email(to_email, product_name, variant_value, product_url)

    @classmethod
    def retry_email_log(cls, log_id: int) -> bool:
        """Re-dispatches a previously logged email synchronously."""
        from app.database.session import SessionLocal
        from app.models.models import EmailLog

        db = SessionLocal()
        try:
            log_item = db.query(EmailLog).filter(EmailLog.id == log_id).first()
            if not log_item:
                return False

            success = cls._send_email_sync(
                to_email=log_item.recipient_email,
                subject=f"[Retry] {log_item.subject}",
                html_content=log_item.html_content or f"<p>{log_item.subject}</p>",
                sender_role="orders",
                template_name=f"{log_item.template_name}_RETRY",
                related_order_id=log_item.related_order_id,
                related_user_id=log_item.related_user_id
            )
            if success:
                log_item.status = "RETRIED"
                db.commit()
            return success
        finally:
            db.close()
