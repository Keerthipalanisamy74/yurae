import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import os
from datetime import datetime
from typing import Optional, Dict, Any

class EmailService:
    SMTP_HOST = os.getenv("SMTP_HOST", os.getenv("BREVO_SMTP_HOST", os.getenv("SENDGRID_SMTP_HOST", "smtp.gmail.com")))
    SMTP_PORT = int(os.getenv("SMTP_PORT", os.getenv("BREVO_SMTP_PORT", "587")))
    SMTP_USER = os.getenv("SMTP_USER", os.getenv("BREVO_SMTP_USER", os.getenv("SENDGRID_SMTP_USER", "")))
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", os.getenv("BREVO_SMTP_KEY", os.getenv("SENDGRID_API_KEY", "")))
    FROM_EMAIL = os.getenv("FROM_EMAIL", os.getenv("SMTP_USER", "concierge@yuraebeauty.com"))
    FROM_NAME = "Yurae Luxury Beauty & Apparel"
    ADMIN_ALERT_EMAIL = os.getenv("ADMIN_ALERT_EMAIL", "admin@yuraebeauty.com")

    @classmethod
    def _send_email(cls, to_email: str, subject: str, html_content: str, text_content: Optional[str] = None) -> bool:
        """
        Sends an email via SMTP (compatible with standard SMTP, Brevo, SendGrid, Mailgun, Amazon SES).
        If SMTP credentials are not configured, logs the dispatch for local verification.
        """
        if not cls.SMTP_USER or not cls.SMTP_PASSWORD:
            clean_subj = subject.encode('ascii', 'ignore').decode('ascii')
            clean_preview = (text_content or subject).encode('ascii', 'ignore').decode('ascii')
            print(f"\n[EMAIL DISPATCH - SIMULATION] To: {to_email} | Subject: {clean_subj}")
            print("--- Plain Text Preview ---")
            print(clean_preview)
            print("--------------------------\n")
            return True

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{cls.FROM_NAME} <{cls.FROM_EMAIL}>"
            msg["To"] = to_email

            if text_content:
                msg.attach(MIMEText(text_content, "plain", "utf-8"))
            msg.attach(MIMEText(html_content, "html", "utf-8"))

            with smtplib.SMTP(cls.SMTP_HOST, cls.SMTP_PORT) as server:
                server.starttls()
                server.login(cls.SMTP_USER, cls.SMTP_PASSWORD)
                server.sendmail(cls.FROM_EMAIL, to_email, msg.as_string())
            print(f"[EMAIL SUCCESS] Delivered to {to_email}")
            return True
        except Exception as e:
            print(f"[EMAIL ERROR] Dispatch failed to {to_email}: {e}")
            return False

    @classmethod
    def send_password_reset_otp(cls, to_email: str, first_name: str, otp: str) -> bool:
        """
        Sends 6-digit password reset OTP verification code.
        """
        subject = f"🔐 {otp} is your Yurae verification code"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #FFF8FA; margin: 0; padding: 20px; color: #111111; }}
            .container {{ max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 1px solid #F1BCCE; padding: 36px 30px; box-shadow: 0 4px 20px rgba(216, 75, 126, 0.08); }}
            .logo {{ text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #D84B7E; font-family: 'Georgia', serif; text-transform: uppercase; margin-bottom: 24px; }}
            .tagline {{ font-size: 11px; letter-spacing: 2px; color: #888888; text-align: center; margin-top: -16px; margin-bottom: 24px; text-transform: uppercase; }}
            .title {{ font-size: 18px; font-weight: bold; color: #111111; margin-bottom: 12px; }}
            .text {{ font-size: 14px; line-height: 1.6; color: #444444; margin-bottom: 24px; }}
            .otp-box {{ background: #FFF0F5; border: 2px dashed #D84B7E; border-radius: 16px; padding: 20px; text-align: center; margin: 24px 0; }}
            .otp-code {{ font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #D84B7E; font-family: monospace; }}
            .otp-hint {{ font-size: 12px; color: #777777; margin-top: 8px; }}
            .footer {{ font-size: 11px; color: #999999; text-align: center; margin-top: 30px; border-top: 1px solid #F1BCCE; padding-top: 20px; }}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">Y U R A E</div>
            <div class="tagline">The Origin of Skincare & Luxury Fashion</div>
            <div class="title">Password Reset Request</div>
            <div class="text">
              Hello {first_name or 'valued patron'},<br><br>
              We received a request to reset the password for your Yurae account. Please use the secure one-time verification code below to complete the reset process:
            </div>
            <div class="otp-box">
              <div class="otp-code">{otp}</div>
              <div class="otp-hint">Expires in 15 minutes • Do not share this code with anyone</div>
            </div>
            <div class="text">
              If you did not initiate this request, you can safely disregard this message; your account remains secure.
            </div>
            <div class="footer">
              © {datetime.now().year} Yurae Beauty & Luxury Apparel. All rights reserved.<br>
              Crafted with botanical precision and luxury elegance.
            </div>
          </div>
        </body>
        </html>
        """
        text_content = f"Hello {first_name},\nYour Yurae password reset code is: {otp}\nThis code expires in 15 minutes."
        return cls._send_email(to_email, subject, html_content, text_content)

    @classmethod
    def send_order_confirmation_email(cls, order: Any, user: Optional[Any] = None) -> bool:
        """
        Sends branded HTML receipt to customer immediately upon checkout.
        """
        addr = getattr(order, 'address', None)
        buyer_user = user or getattr(order, 'user', None)

        to_email = getattr(order, 'shipping_email', None) or (buyer_user.email if buyer_user else None)
        if not to_email:
            return False

        customer_name = (addr.name if addr else None) or (f"{buyer_user.first_name} {buyer_user.last_name}" if buyer_user else "Valued Patron")
        subject = f"✨ Order Confirmed: #{order.order_number} — Yurae Beauty & Luxury"
        payment_method = order.payments[0].payment_method if getattr(order, 'payments', None) and len(order.payments) > 0 else ("Cash on Delivery (COD)" if getattr(order, 'is_cod', False) else "Prepaid Online")

        # Build items table HTML
        items_html = ""
        for item in order.items:
            variant_str = f" • <span style='color: #D84B7E;'>{item.variant_info}</span>" if getattr(item, 'variant_info', None) else ""
            items_html += f"""
            <tr style="border-bottom: 1px solid #F8D7E3;">
              <td style="padding: 12px 8px; font-size: 13px; color: #111111;">
                <strong>{item.product_name}</strong>{variant_str}
              </td>
              <td style="padding: 12px 8px; text-align: center; font-size: 13px; color: #555555;">
                {item.quantity}
              </td>
              <td style="padding: 12px 8px; text-align: right; font-size: 13px; font-weight: bold; color: #111111;">
                {order.currency} {item.price * item.quantity:,.2f}
              </td>
            </tr>
            """

        subtotal_val = getattr(order, 'subtotal', getattr(order, 'subtotal_amount', 0.0))
        discount_val = getattr(order, 'discount', getattr(order, 'discount_amount', 0.0)) or 0.0
        shipping_val = getattr(order, 'shipping_fee', getattr(order, 'shipping_amount', 0.0)) or 0.0

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #FFF8FA; margin: 0; padding: 20px; color: #111111; }}
            .container {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; border: 1px solid #F1BCCE; padding: 36px 30px; box-shadow: 0 4px 25px rgba(216, 75, 126, 0.08); }}
            .logo {{ text-align: center; font-size: 26px; font-weight: bold; letter-spacing: 5px; color: #D84B7E; font-family: 'Georgia', serif; text-transform: uppercase; margin-bottom: 6px; }}
            .tagline {{ font-size: 10px; letter-spacing: 2px; color: #888888; text-align: center; margin-bottom: 24px; text-transform: uppercase; }}
            .badge {{ display: inline-block; background: #FCE7F0; color: #D84B7E; font-weight: bold; font-size: 11px; padding: 6px 14px; border-radius: 20px; margin-bottom: 16px; }}
            .order-card {{ background: #FFF8FA; border: 1px solid #F1BCCE; border-radius: 16px; padding: 18px; margin: 20px 0; }}
            .table {{ width: 100%; border-collapse: collapse; margin-top: 12px; }}
            .total-row {{ font-size: 15px; font-weight: bold; color: #D84B7E; }}
            .address-box {{ background: #FAFAFA; border-radius: 12px; padding: 14px; margin-top: 16px; font-size: 12px; line-height: 1.5; color: #444444; }}
            .footer {{ font-size: 11px; color: #999999; text-align: center; margin-top: 30px; border-top: 1px solid #F1BCCE; padding-top: 20px; }}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">Y U R A E</div>
            <div class="tagline">The Origin of Skincare & Luxury Apparel</div>
            
            <div style="text-align: center;">
              <div class="badge">✓ Order Successfully Placed</div>
              <h2 style="font-family: 'Georgia', serif; margin: 8px 0; font-size: 22px;">Thank you for your order, {customer_name}!</h2>
              <p style="font-size: 13px; color: #555555; margin-bottom: 20px;">
                We are preparing your exquisite ritual selection. You will receive live tracking once your parcel is dispatched.
              </p>
            </div>

            <div class="order-card">
              <div style="display: flex; justify-content: space-between; font-size: 12px; color: #666666; margin-bottom: 12px;">
                <span><strong>Order #:</strong> {order.order_number}</span>
                <span><strong>Payment:</strong> {payment_method} ({order.payment_status})</span>
              </div>

              <table class="table">
                <thead>
                  <tr style="border-bottom: 2px solid #F1BCCE; font-size: 11px; text-transform: uppercase; color: #888888;">
                    <th style="text-align: left; padding: 8px;">Item</th>
                    <th style="text-align: center; padding: 8px;">Qty</th>
                    <th style="text-align: right; padding: 8px;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items_html}
                </tbody>
              </table>

              <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid #F1BCCE; font-size: 13px; line-height: 1.8;">
                <div style="display: flex; justify-content: space-between; color: #666666;">
                  <span>Subtotal</span>
                  <span>{order.currency} {subtotal_val:,.2f}</span>
                </div>
                {f'<div style="display: flex; justify-content: space-between; color: #D84B7E;"><span>Coupon Discount</span><span>-{order.currency} {discount_val:,.2f}</span></div>' if discount_val > 0 else ''}
                <div style="display: flex; justify-content: space-between; color: #666666;">
                  <span>Express Luxury Shipping</span>
                  <span>{f"{order.currency} {shipping_val:,.2f}" if shipping_val > 0 else "FREE"}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; color: #111111; margin-top: 6px; padding-top: 6px; border-top: 1px dashed #F1BCCE;">
                  <span>Total Amount</span>
                  <span style="color: #D84B7E;">{order.currency} {order.total_amount:,.2f}</span>
                </div>
              </div>
            </div>

            <div class="address-box">
              <strong style="color: #111111; text-transform: uppercase; font-size: 11px; letter-spacing: 1px;">Delivery Address</strong><br>
              {addr.name if addr else customer_name}<br>
              {addr.address_line1 if addr else 'Standard Delivery'}{f", {addr.address_line2}" if addr and addr.address_line2 else ""}<br>
              {f"{addr.city}, {addr.state} - {addr.postal_code}" if addr else "Chennai, Tamil Nadu"}<br>
              {f"{addr.country} • Ph: {addr.phone}" if addr else "India"}
            </div>

            <div class="footer">
              Questions? Reply directly to this email or reach us at concierge@yuraebeauty.com.<br>
              © {datetime.now().year} Yurae Beauty & Luxury Apparel. All rights reserved.
            </div>
          </div>
        </body>
        </html>
        """
        text_content = f"Thank you for your order #{order.order_number}! Total: {order.currency} {order.total_amount:,.2f}. We will notify you when it ships."
        return cls._send_email(to_email, subject, html_content, text_content)

    @classmethod
    def send_admin_new_order_alert_email(cls, order: Any, user: Optional[Any] = None) -> bool:
        """
        Notifies store owners / administrators immediately when a new order is placed.
        """
        to_email = cls.ADMIN_ALERT_EMAIL
        addr = getattr(order, 'address', None)
        buyer_user = user or getattr(order, 'user', None)

        customer_name = (addr.name if addr else None) or (f"{buyer_user.first_name} {buyer_user.last_name}" if buyer_user else "Patron")
        customer_email = (buyer_user.email if buyer_user else None) or getattr(order, 'shipping_email', 'N/A')
        customer_phone = (addr.phone if addr else None) or (buyer_user.phone if buyer_user and buyer_user.phone else "N/A")
        dest_city = f"{addr.city}, {addr.state}" if addr else "India"

        subject = f"🔔 [New Order Received] #{order.order_number} — {order.currency} {order.total_amount:,.2f} ({customer_name})"
        payment_method = order.payments[0].payment_method if getattr(order, 'payments', None) and len(order.payments) > 0 else ("Cash on Delivery (COD)" if getattr(order, 'is_cod', False) else "Prepaid Online")

        # Build items list
        items_rows = ""
        for it in order.items:
            variant_str = f" ({it.variant_info})" if getattr(it, 'variant_info', None) else ""
            items_rows += f"""
            <tr style="border-bottom: 1px solid #ECECEC;">
              <td style="padding: 8px 4px; font-size: 13px;"><b>{it.product_name}</b>{variant_str}</td>
              <td style="padding: 8px 4px; text-align: center; font-size: 13px;">{it.quantity}</td>
              <td style="padding: 8px 4px; text-align: right; font-size: 13px; font-family: monospace;">{order.currency} {it.price * it.quantity:,.2f}</td>
            </tr>
            """

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #F8F9FA; margin: 0; padding: 20px; color: #111111; }}
            .container {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #E5E7EB; padding: 30px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05); }}
            .header {{ border-bottom: 2px solid #111111; padding-bottom: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }}
            .title {{ font-size: 20px; font-weight: bold; color: #111111; }}
            .badge {{ background: #111111; color: #ffffff; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; }}
            .metric-card {{ background: #FFF8FA; border: 1px solid #F1BCCE; border-radius: 12px; padding: 16px; margin: 16px 0; }}
            .table {{ width: 100%; border-collapse: collapse; margin-top: 10px; }}
            .footer {{ font-size: 11px; color: #888888; text-align: center; margin-top: 24px; border-top: 1px solid #EEEEEE; padding-top: 16px; }}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="title">🔔 New Store Order Received</div>
              <span class="badge">Store Alert</span>
            </div>

            <p style="font-size: 14px; color: #333333; margin-bottom: 16px;">
              A new order <strong>#{order.order_number}</strong> was just placed on the Yurae luxury store.
            </p>

            <div class="metric-card">
              <table style="width: 100%; font-size: 13px; line-height: 1.8;">
                <tr>
                  <td style="color: #666666;"><strong>Order Amount:</strong></td>
                  <td style="text-align: right; color: #D84B7E; font-weight: bold; font-size: 16px;">{order.currency} {order.total_amount:,.2f}</td>
                </tr>
                <tr>
                  <td style="color: #666666;"><strong>Payment:</strong></td>
                  <td style="text-align: right;">{payment_method} ({order.payment_status})</td>
                </tr>
                <tr>
                  <td style="color: #666666;"><strong>Customer:</strong></td>
                  <td style="text-align: right;">{customer_name} ({customer_email})</td>
                </tr>
                <tr>
                  <td style="color: #666666;"><strong>Destination:</strong></td>
                  <td style="text-align: right;">{dest_city} (Ph: {customer_phone})</td>
                </tr>
              </table>
            </div>

            <h4 style="font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #111111; margin-top: 20px; margin-bottom: 8px;">Order Items</h4>
            <table class="table">
              <thead>
                <tr style="border-bottom: 2px solid #E5E7EB; font-size: 11px; color: #888888; text-transform: uppercase;">
                  <th style="text-align: left; padding: 6px 4px;">Item</th>
                  <th style="text-align: center; padding: 6px 4px;">Qty</th>
                  <th style="text-align: right; padding: 6px 4px;">Total</th>
                </tr>
              </thead>
              <tbody>
                {items_rows}
              </tbody>
            </table>

            <div style="text-align: center; margin-top: 24px;">
              <a href="http://localhost:5173/admin" style="display: inline-block; background: #111111; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 24px; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">
                Open Admin Fulfillment Center →
              </a>
            </div>

            <div class="footer">
              Yurae Automated Store Dispatcher • Real-time notifications
            </div>
          </div>
        </body>
        </html>
        """
        text_content = f"New Order Received: #{order.order_number} by {customer_name} for {order.currency} {order.total_amount:,.2f}. Payment: {payment_method}."
        return cls._send_email(to_email, subject, html_content, text_content)

    @classmethod
    def send_shipment_dispatched_email(cls, order: Any, tracking_info: Dict[str, Any]) -> bool:
        """
        Sends dispatch notification with AWB waybill number and live tracking URL.
        """
        addr = getattr(order, 'address', None)
        buyer_user = getattr(order, 'user', None)
        to_email = getattr(order, 'shipping_email', None) or (buyer_user.email if buyer_user else None)
        if not to_email:
            return False

        awb = tracking_info.get("awb_code") or tracking_info.get("tracking_number") or getattr(order, 'awb_code', 'N/A')
        courier = tracking_info.get("courier_name") or getattr(order, 'courier_name', 'Express Luxury Logistics')
        tracking_url = tracking_info.get("tracking_url") or getattr(order, 'tracking_url', f"https://yuraebeauty.com/track/{order.order_number}")
        customer_name = (addr.name if addr else None) or (f"{buyer_user.first_name} {buyer_user.last_name}" if buyer_user else "Valued Patron")

        subject = f"📦 Your Yurae Order #{order.order_number} Has Shipped!"
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #FFF8FA; margin: 0; padding: 20px; color: #111111; }}
            .container {{ max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 1px solid #F1BCCE; padding: 36px 30px; box-shadow: 0 4px 20px rgba(216, 75, 126, 0.08); }}
            .logo {{ text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #D84B7E; font-family: 'Georgia', serif; text-transform: uppercase; margin-bottom: 12px; }}
            .tracking-card {{ background: #FFF0F5; border: 1px solid #F1BCCE; border-radius: 16px; padding: 20px; text-align: center; margin: 24px 0; }}
            .btn {{ display: inline-block; background: #D84B7E; color: #ffffff; padding: 12px 28px; border-radius: 30px; text-decoration: none; font-weight: bold; font-size: 13px; letter-spacing: 1px; text-transform: uppercase; margin-top: 16px; }}
            .footer {{ font-size: 11px; color: #999999; text-align: center; margin-top: 30px; border-top: 1px solid #F1BCCE; padding-top: 20px; }}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">Y U R A E</div>
            <h2 style="text-align: center; font-family: 'Georgia', serif; margin-bottom: 8px;">Your Order is On Its Way!</h2>
            <p style="font-size: 13px; color: #555555; text-align: center;">
              Hello {customer_name}, your order <strong>#{order.order_number}</strong> has been carefully packed and handed over to our courier partner.
            </p>

            <div class="tracking-card">
              <div style="font-size: 12px; color: #666666; text-transform: uppercase; letter-spacing: 1px;">Courier Partner</div>
              <div style="font-size: 16px; font-weight: bold; color: #111111; margin: 4px 0 12px;">{courier}</div>
              <div style="font-size: 12px; color: #666666; text-transform: uppercase; letter-spacing: 1px;">Waybill / AWB Number</div>
              <div style="font-size: 18px; font-weight: 800; color: #D84B7E; font-family: monospace;">{awb}</div>
              <a href="{tracking_url}" class="btn" style="color: #ffffff;">Track Package Live</a>
            </div>

            <div class="footer">
              Thank you for choosing Yurae Beauty & Luxury Apparel.<br>
              © {datetime.now().year} Yurae. All rights reserved.
            </div>
          </div>
        </body>
        </html>
        """
        text_content = f"Your order #{order.order_number} has shipped via {courier} (AWB: {awb}). Track live: {tracking_url}"
        return cls._send_email(to_email, subject, html_content, text_content)

    @classmethod
    def send_stock_notification_registered_email(cls, to_email: str, product_name: str, variant_value: Optional[str] = None) -> bool:
        """Sends a confirmation when a customer subscribes to back-in-stock alerts."""
        size_label = f" (Size / Variant: {variant_value})" if variant_value else ""
        subject = f"🔔 You're On the Priority List for {product_name}"
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #FFF8FA; margin: 0; padding: 20px; color: #111111; }}
            .container {{ max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 1px solid #F1BCCE; padding: 36px 30px; }}
            .logo {{ text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #D84B7E; font-family: 'Georgia', serif; text-transform: uppercase; margin-bottom: 12px; }}
            .card {{ background: #FFF0F5; border: 1px solid #F1BCCE; border-radius: 16px; padding: 20px; text-align: center; margin: 20px 0; }}
            .footer {{ font-size: 11px; color: #999999; text-align: center; margin-top: 30px; border-top: 1px solid #F1BCCE; padding-top: 20px; }}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">Y U R A E</div>
            <h2 style="text-align: center; font-family: 'Georgia', serif; margin-bottom: 8px;">Restock Notification Confirmed</h2>
            <p style="font-size: 13px; color: #555555; text-align: center;">
              We have added you to our private priority list. The moment <strong>{product_name}{size_label}</strong> is back in stock, we will immediately send you an alert.
            </p>
            <div class="card">
              <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #D84B7E; font-weight: bold;">Reserved Alert</div>
              <div style="font-size: 16px; font-weight: bold; color: #111111; margin-top: 4px;">{product_name}{size_label}</div>
            </div>
            <div class="footer">
              © {datetime.now().year} Yurae Beauty. All rights reserved.
            </div>
          </div>
        </body>
        </html>
        """
        text_content = f"You are on the priority restock list for {product_name}{size_label}. We will notify you immediately once available."
        return cls._send_email(to_email, subject, html_content, text_content)

    @classmethod
    def send_back_in_stock_email(cls, to_email: str, product_name: str, variant_value: Optional[str] = None, product_url: Optional[str] = None) -> bool:
        """Sends an alert when an item or specific size has been restocked."""
        size_label = f" in {variant_value}" if variant_value else ""
        subject = f"✨ Great News: {product_name}{size_label} Is Back in Stock!"
        target_url = product_url or "http://localhost:5173/shop"
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #FFF8FA; margin: 0; padding: 20px; color: #111111; }}
            .container {{ max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 1px solid #F1BCCE; padding: 36px 30px; box-shadow: 0 4px 20px rgba(216, 75, 126, 0.08); }}
            .logo {{ text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #D84B7E; font-family: 'Georgia', serif; text-transform: uppercase; margin-bottom: 12px; }}
            .card {{ background: #FFF0F5; border: 1px solid #F1BCCE; border-radius: 16px; padding: 24px 20px; text-align: center; margin: 24px 0; }}
            .btn {{ display: inline-block; background: #D84B7E; color: #ffffff; padding: 14px 32px; border-radius: 30px; text-decoration: none; font-weight: bold; font-size: 13px; letter-spacing: 1px; text-transform: uppercase; margin-top: 16px; }}
            .footer {{ font-size: 11px; color: #999999; text-align: center; margin-top: 30px; border-top: 1px solid #F1BCCE; padding-top: 20px; }}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">Y U R A E</div>
            <h2 style="text-align: center; font-family: 'Georgia', serif; margin-bottom: 8px;">It's Finally Back!</h2>
            <p style="font-size: 13px; color: #555555; text-align: center;">
              You asked us to let you know, and it's officially here! <strong>{product_name}{size_label}</strong> has been restocked and is available for order right now.
            </p>
            <div class="card">
              <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #D84B7E; font-weight: bold;">Available Now</div>
              <div style="font-size: 18px; font-weight: bold; color: #111111; margin: 6px 0 16px;">{product_name}{size_label}</div>
              <a href="{target_url}" class="btn" style="color: #ffffff;">Order Your Piece Now</a>
            </div>
            <div class="footer">
              Quantities are limited. We recommend completing your order promptly to avoid missing out.<br>
              © {datetime.now().year} Yurae Beauty & Luxury Apparel.
            </div>
          </div>
        </body>
        </html>
        """
        text_content = f"Great news! {product_name}{size_label} is back in stock. Order now: {target_url}"
        return cls._send_email(to_email, subject, html_content, text_content)

