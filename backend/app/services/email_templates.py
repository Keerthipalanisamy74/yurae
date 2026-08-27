"""
Yurae Beauty — Enterprise Luxury HTML Email Template Engine
Compatible with Gmail, Apple Mail, Outlook (Desktop & Web), iOS Mail, and Android.
Uses clean table-based layouts with CSS inline styling for maximum deliverability.
Brand: Yurae Beauty | "The Origin of Skincare"
"""

from datetime import datetime
from typing import Any, Optional, Dict, List


def _format_currency(amount: float, currency: str = "INR") -> str:
    symbol = "₹" if currency.upper() in ("INR", "RS") else (
        "$" if currency.upper() == "USD" else (
            "€" if currency.upper() == "EUR" else (
                "£" if currency.upper() == "GBP" else f"{currency} "
            )
        )
    )
    return f"{symbol}{amount:,.2f}"


def _base_layout(
    title: str,
    preheader: str,
    body_content: str,
    frontend_url: str = "https://yuraebeauty.com",
    footer_support_email: str = "support@yuraebeauty.com",
    show_unsubscribe: bool = False
) -> str:
    year = datetime.now().year
    return f"""<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>{title}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* Reset */
    body, table, td, a {{ -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }}
    table, td {{ mso-table-lspace: 0pt; mso-table-rspace: 0pt; }}
    img {{ -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }}
    body {{ height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #FFF8FA; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }}
    /* Utility */
    .preheader {{ display: none; max-height: 0px; overflow: hidden; mso-hide: all; font-size: 1px; line-height: 1px; color: #FFF8FA; opacity: 0; }}
    @media screen and (max-width: 600px) {{
      .email-container {{ width: 100% !important; margin: auto !important; }}
      .fluid {{ max-width: 100% !important; height: auto !important; margin-left: auto !important; margin-right: auto !important; }}
      .stack-column, .stack-column-center {{ display: block !important; width: 100% !important; max-width: 100% !important; direction: ltr !important; }}
      .stack-column-center {{ text-align: center !important; }}
      .center-on-narrow {{ text-align: center !important; display: block !important; margin-left: auto !important; margin-right: auto !important; float: none !important; }}
      .mobile-padding {{ padding-left: 16px !important; padding-right: 16px !important; }}
    }}
  </style>
</head>
<body style="background-color: #FFF8FA; margin: 0; padding: 0; width: 100%;">
  <!-- Hidden Preheader -->
  <span class="preheader">{preheader}</span>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FFF8FA; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 30px 12px 40px 12px;">
        <!-- Email Container (600px Max) -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 600px; background-color: #ffffff; border: 1px solid #F1BCCE; border-radius: 24px; box-shadow: 0 4px 25px rgba(216, 75, 126, 0.08); overflow: hidden;">
          
          <!-- Brand Luxury Header -->
          <tr>
            <td align="center" style="padding: 36px 24px 20px 24px; border-bottom: 1px solid #FAF0F4;">
              <a href="{frontend_url}" target="_blank" style="text-decoration: none;">
                <div style="font-family: 'Georgia', serif; font-size: 26px; font-weight: 700; letter-spacing: 5px; color: #D84B7E; text-transform: uppercase; margin: 0 0 4px 0;">
                  Y U R A E
                </div>
                <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 10px; letter-spacing: 2.5px; color: #888888; text-transform: uppercase;">
                  The Origin of Skincare &amp; Luxury Fashion
                </div>
              </a>
            </td>
          </tr>

          <!-- Dynamic Body Content -->
          <tr>
            <td style="padding: 32px 30px 36px 30px;" class="mobile-padding">
              {body_content}
            </td>
          </tr>

          <!-- Luxury Brand Footer -->
          <tr>
            <td align="center" style="background-color: #FFF8FA; padding: 24px 24px 28px 24px; border-top: 1px solid #F1BCCE; font-size: 11px; color: #888888; line-height: 1.6;">
              <p style="margin: 0 0 8px 0;">
                Need assistance? Our concierge atelier is always available at <a href="mailto:{footer_support_email}" style="color: #D84B7E; font-weight: bold; text-decoration: none;">{footer_support_email}</a>.
              </p>
              <p style="margin: 0 0 12px 0;">
                <a href="{frontend_url}/shop" style="color: #666666; text-decoration: none; margin: 0 8px;">Explore Rituals</a> •
                <a href="{frontend_url}/account" style="color: #666666; text-decoration: none; margin: 0 8px;">My Account</a> •
                <a href="{frontend_url}/contact" style="color: #666666; text-decoration: none; margin: 0 8px;">Concierge</a>
              </p>
              <p style="margin: 0; color: #aaaaaa; font-size: 10px;">
                &copy; {year} Yurae Beauty &amp; Luxury Apparel. All rights reserved.<br>
                Crafted with Korean botanical bio-actives and bespoke luxury standards.
              </p>
              {f'<p style="margin: 8px 0 0 0; font-size: 10px;"><a href="{frontend_url}/unsubscribe" style="color: #aaaaaa; text-decoration: underline;">Unsubscribe from promotional rituals</a></p>' if show_unsubscribe else ''}
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


# ==============================================================================
# 1. 🌸 WELCOME & ACCOUNT REGISTRATION EMAIL (noreply@yuraebeauty.com)
# ==============================================================================
def render_welcome_email(user: Any, frontend_url: str = "https://yuraebeauty.com") -> Dict[str, str]:
    first_name = getattr(user, 'first_name', '') or 'Valued Patron'
    subject = "🌿 Welcome to Yurae Beauty — Your Pure Skincare Ritual Begins"
    preheader = f"Welcome {first_name}, discover botanical excellence and Korean glass-skin rituals."

    body = f"""
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="display: inline-block; background-color: #FCE7F0; color: #D84B7E; font-weight: bold; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; padding: 6px 16px; border-radius: 20px;">
        Welcome to the Atelier
      </span>
      <h1 style="font-family: 'Georgia', serif; font-size: 22px; font-weight: 700; color: #111111; margin: 16px 0 8px 0;">
        Welcome to Yurae, {first_name}!
      </h1>
      <p style="font-size: 14px; line-height: 1.6; color: #555555; margin: 0 auto; max-width: 480px;">
        Thank you for joining our private skincare circle. Inspired by the purity of pristine Korean botanicals, every formulation is curated to awaken timeless glass-skin radiance.
      </p>
    </div>

    <div style="background-color: #FFF8FA; border: 1px solid #F1BCCE; border-radius: 16px; padding: 20px; margin: 24px 0; text-align: left;">
      <h3 style="font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; color: #D84B7E; margin: 0 0 12px 0;">
        Your Member Privileges
      </h3>
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 13px; color: #444444; line-height: 1.8;">
        <tr>
          <td style="padding: 4px 0; width: 24px; vertical-align: top;">✨</td>
          <td style="padding: 4px 0;"><strong>Artisanal Formulations:</strong> Zero parabens, botanical bio-actives.</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; vertical-align: top;">💎</td>
          <td style="padding: 4px 0;"><strong>Seamless Concierge:</strong> Live order tracking, doorstep express delivery.</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; vertical-align: top;">🎁</td>
          <td style="padding: 4px 0;"><strong>Private Access:</strong> Early invitations to limited drops and atelier previews.</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin-top: 30px;">
      <a href="{frontend_url}/shop" target="_blank" style="display: inline-block; background-color: #D84B7E; color: #ffffff; text-decoration: none; padding: 14px 34px; border-radius: 30px; font-size: 13px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; box-shadow: 0 4px 15px rgba(216, 75, 126, 0.25);">
        Explore Skincare Rituals →
      </a>
    </div>
    """

    html = _base_layout(subject, preheader, body, frontend_url, footer_support_email="support@yuraebeauty.com")
    text = f"Welcome to Yurae Beauty, {first_name}!\n\nYour account is active. Explore our botanical rituals at {frontend_url}/shop\n\nQuestions? Contact support@yuraebeauty.com"
    return {"subject": subject, "html": html, "text": text}


# ==============================================================================
# 2. 🔐 OTP VERIFICATION & PASSWORD RESET (noreply@yuraebeauty.com)
# ==============================================================================
def render_otp_email(
    first_name: str,
    otp: str,
    purpose: str = "Password Reset Request",
    expires_minutes: int = 15,
    frontend_url: str = "https://yuraebeauty.com"
) -> Dict[str, str]:
    subject = f"🔐 {otp} is your Yurae verification code"
    preheader = f"Use verification code {otp} to complete your {purpose.lower()}. Code expires in {expires_minutes} minutes."

    body = f"""
    <div style="text-align: center; margin-bottom: 20px;">
      <span style="display: inline-block; background-color: #FCE7F0; color: #D84B7E; font-weight: bold; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; padding: 6px 16px; border-radius: 20px;">
        Account Security Code
      </span>
      <h1 style="font-family: 'Georgia', serif; font-size: 22px; font-weight: 700; color: #111111; margin: 16px 0 8px 0;">
        {purpose}
      </h1>
      <p style="font-size: 13px; line-height: 1.6; color: #555555; margin: 0 auto; max-width: 460px;">
        Hello {first_name or 'Valued Patron'}, we received a security verification request for your Yurae account. Please use the one-time authentication code below:
      </p>
    </div>

    <!-- OTP Display Box -->
    <div style="background-color: #FFF8FA; border: 2px dashed #D84B7E; border-radius: 16px; padding: 24px 20px; text-align: center; margin: 24px 0;">
      <div style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #D84B7E; margin-left: 10px;">
        {otp}
      </div>
      <div style="font-size: 11px; color: #777777; margin-top: 10px; text-transform: uppercase; letter-spacing: 1px;">
        ⏱️ Valid for {expires_minutes} minutes • Never share this code with anyone
      </div>
    </div>

    <p style="font-size: 12px; color: #777777; line-height: 1.6; text-align: center; margin: 0;">
      If you did not initiate this request, your account remains safe. You can securely disregard this notification.
    </p>
    """

    html = _base_layout(subject, preheader, body, frontend_url, footer_support_email="support@yuraebeauty.com")
    text = f"Hello {first_name},\n\nYour Yurae security verification code is: {otp}\n\nThis code is valid for {expires_minutes} minutes. If you did not request this, please disregard this email."
    return {"subject": subject, "html": html, "text": text}


# ==============================================================================
# 3. 🔑 PASSWORD RESET CONFIRMATION (noreply@yuraebeauty.com)
# ==============================================================================
def render_password_reset_confirmation(
    first_name: str,
    frontend_url: str = "https://yuraebeauty.com"
) -> Dict[str, str]:
    subject = "✓ Password Changed Successfully — Yurae Security"
    preheader = f"Hello {first_name}, the password for your Yurae account was successfully updated."

    body = f"""
    <div style="text-align: center; margin-bottom: 20px;">
      <span style="display: inline-block; background-color: #E6F7F0; color: #00875A; font-weight: bold; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; padding: 6px 16px; border-radius: 20px;">
        Security Notice
      </span>
      <h1 style="font-family: 'Georgia', serif; font-size: 22px; font-weight: 700; color: #111111; margin: 16px 0 8px 0;">
        Password Updated Successfully
      </h1>
      <p style="font-size: 13px; line-height: 1.6; color: #555555; margin: 0 auto; max-width: 460px;">
        Hello {first_name or 'Valued Patron'}, this confirms that the password for your Yurae account has been reset.
      </p>
    </div>

    <div style="background-color: #FFF8FA; border: 1px solid #F1BCCE; border-radius: 14px; padding: 18px; margin: 20px 0; font-size: 13px; color: #444444; line-height: 1.6;">
      <strong>Did not make this change?</strong><br>
      If you did not request this password reset, please notify our security team immediately at <a href="mailto:support@yuraebeauty.com" style="color: #D84B7E; font-weight: bold;">support@yuraebeauty.com</a> to protect your account.
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="{frontend_url}/account" target="_blank" style="display: inline-block; background-color: #111111; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 30px; font-size: 12px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase;">
        View My Account →
      </a>
    </div>
    """

    html = _base_layout(subject, preheader, body, frontend_url, footer_support_email="support@yuraebeauty.com")
    text = f"Hello {first_name},\n\nYour Yurae account password has been successfully updated.\n\nIf you did not perform this change, please contact support@yuraebeauty.com immediately."
    return {"subject": subject, "html": html, "text": text}


# ==============================================================================
# 4. 📦 ORDER CONFIRMATION EMAIL (orders@yuraebeauty.com)
# ==============================================================================
def render_order_confirmation(
    order: Any,
    user: Optional[Any] = None,
    frontend_url: str = "https://yuraebeauty.com"
) -> Dict[str, str]:
    addr = getattr(order, 'address', None)
    buyer_user = user or getattr(order, 'user', None)
    customer_name = (addr.name if addr else None) or (f"{buyer_user.first_name} {buyer_user.last_name}" if buyer_user else "Valued Patron")
    currency = getattr(order, 'currency', 'INR')

    subject = f"✨ Order Confirmed: #{order.order_number} — Yurae Beauty"
    preheader = f"Thank you {customer_name}! Your order #{order.order_number} for {_format_currency(order.total_amount, currency)} is confirmed and preparing."

    payment_method = (
        order.payments[0].payment_method if getattr(order, 'payments', None) and len(order.payments) > 0
        else ("Cash on Delivery (COD)" if getattr(order, 'is_cod', False) else "Prepaid Online")
    )
    payment_status = getattr(order, 'payment_status', 'Paid')
    order_date = order.created_at.strftime("%d %B %Y, %I:%M %p") if getattr(order, 'created_at', None) else "Today"

    # Items rows
    items_html = ""
    for item in getattr(order, 'items', []):
        variant_str = f"<br><span style='color: #D84B7E; font-size: 11px;'>{item.variant_info}</span>" if getattr(item, 'variant_info', None) else ""
        item_total = item.price * item.quantity
        items_html += f"""
        <tr style="border-bottom: 1px solid #FAF0F4;">
          <td style="padding: 12px 8px; font-size: 13px; color: #111111;">
            <strong>{item.product_name}</strong>{variant_str}
          </td>
          <td align="center" style="padding: 12px 8px; font-size: 13px; color: #555555;">
            {item.quantity}
          </td>
          <td align="right" style="padding: 12px 8px; font-size: 13px; font-weight: bold; color: #111111; font-family: monospace;">
            {_format_currency(item_total, currency)}
          </td>
        </tr>
        """

    subtotal_val = getattr(order, 'subtotal', getattr(order, 'subtotal_amount', 0.0))
    discount_val = getattr(order, 'discount', getattr(order, 'discount_amount', 0.0)) or 0.0
    tax_val = getattr(order, 'tax', 0.0) or 0.0
    shipping_val = getattr(order, 'shipping_fee', getattr(order, 'shipping_amount', 0.0)) or 0.0

    # Address lines
    street_1 = getattr(addr, 'address_line1', '') if addr else "Standard Shipping Destination"
    street_2 = getattr(addr, 'address_line2', '') if addr else ""
    city = getattr(addr, 'city', '') if addr else ""
    state = getattr(addr, 'state', '') if addr else ""
    pincode = getattr(addr, 'postal_code', '') if addr else ""
    country = getattr(addr, 'country', 'India') if addr else "India"
    phone = getattr(addr, 'phone', '') if addr else (getattr(buyer_user, 'phone', '') if buyer_user else '')

    body = f"""
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="display: inline-block; background-color: #FCE7F0; color: #D84B7E; font-weight: bold; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; padding: 6px 16px; border-radius: 20px;">
        ✓ Order Successfully Confirmed
      </span>
      <h1 style="font-family: 'Georgia', serif; font-size: 22px; font-weight: 700; color: #111111; margin: 16px 0 8px 0;">
        Thank you for your order, {customer_name}!
      </h1>
      <p style="font-size: 13px; line-height: 1.6; color: #555555; margin: 0 auto; max-width: 480px;">
        We have received your order <strong>#{order.order_number}</strong> placed on {order_date}. Our atelier is now handcrafting and packaging your selection with delicate botanical care.
      </p>
    </div>

    <!-- Order Metadata Card -->
    <div style="background-color: #FFF8FA; border: 1px solid #F1BCCE; border-radius: 16px; padding: 18px; margin: 20px 0;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 12px; line-height: 1.8; color: #555555;">
        <tr>
          <td><strong>Order Number:</strong> <span style="font-family: monospace; font-weight: bold; color: #111111;">#{order.order_number}</span></td>
          <td align="right"><strong>Payment:</strong> {payment_method} (<span style="color: #00875A; font-weight: bold;">{payment_status}</span>)</td>
        </tr>
      </table>

      <!-- Items Table -->
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 14px; border-collapse: collapse;">
        <thead>
          <tr style="border-bottom: 2px solid #F1BCCE; font-size: 11px; text-transform: uppercase; color: #888888; letter-spacing: 1px;">
            <th align="left" style="padding: 8px;">Product</th>
            <th align="center" style="padding: 8px;">Qty</th>
            <th align="right" style="padding: 8px;">Price</th>
          </tr>
        </thead>
        <tbody>
          {items_html}
        </tbody>
      </table>

      <!-- Cost Breakdown -->
      <div style="margin-top: 16px; padding-top: 14px; border-top: 1px solid #F1BCCE; font-size: 13px; line-height: 1.8;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td style="color: #666666;">Subtotal</td>
            <td align="right" style="font-family: monospace;">{_format_currency(subtotal_val, currency)}</td>
          </tr>
          {f'<tr><td style="color: #D84B7E;">Coupon Discount</td><td align="right" style="color: #D84B7E; font-family: monospace;">-{_format_currency(discount_val, currency)}</td></tr>' if discount_val > 0 else ''}
          {f'<tr><td style="color: #666666;">Estimated Tax / GST</td><td align="right" style="font-family: monospace;">{_format_currency(tax_val, currency)}</td></tr>' if tax_val > 0 else ''}
          <tr>
            <td style="color: #666666;">Express Luxury Shipping</td>
            <td align="right" style="font-family: monospace; color: #00875A;">{_format_currency(shipping_val, currency) if shipping_val > 0 else "FREE"}</td>
          </tr>
          <tr style="font-size: 16px; font-weight: bold; color: #111111; border-top: 1px dashed #F1BCCE;">
            <td style="padding-top: 8px;">Grand Total</td>
            <td align="right" style="padding-top: 8px; color: #D84B7E; font-family: monospace;">{_format_currency(order.total_amount, currency)}</td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Shipping Address Box -->
    <div style="background-color: #FAFAFA; border-radius: 12px; border: 1px solid #EEEEEE; padding: 16px; margin-top: 20px; font-size: 12px; line-height: 1.6; color: #444444;">
      <strong style="color: #111111; text-transform: uppercase; font-size: 11px; letter-spacing: 1px;">📍 Shipping Destination</strong><br>
      {customer_name}<br>
      {street_1}{f", {street_2}" if street_2 else ""}<br>
      {city}{f", {state}" if state else ""}{f" - {pincode}" if pincode else ""}<br>
      {country}{f" • Ph: {phone}" if phone else ""}
    </div>

    <div style="text-align: center; margin-top: 28px;">
      <a href="{frontend_url}/account" target="_blank" style="display: inline-block; background-color: #D84B7E; color: #ffffff; text-decoration: none; padding: 13px 32px; border-radius: 30px; font-size: 12px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase;">
        View Order Status in Portal →
      </a>
    </div>
    """

    html = _base_layout(subject, preheader, body, frontend_url, footer_support_email="orders@yuraebeauty.com")
    text = f"Thank you for your order #{order.order_number}!\nTotal: {_format_currency(order.total_amount, currency)}\nStatus: {order.order_status}\n\nWe will notify you with tracking information as soon as your package ships."
    return {"subject": subject, "html": html, "text": text}


# ==============================================================================
# 5. 🎁 ORDER PACKED NOTIFICATION (orders@yuraebeauty.com)
# ==============================================================================
def render_order_packed(
    order: Any,
    user: Optional[Any] = None,
    frontend_url: str = "https://yuraebeauty.com"
) -> Dict[str, str]:
    addr = getattr(order, 'address', None)
    buyer_user = user or getattr(order, 'user', None)
    customer_name = (addr.name if addr else None) or (f"{buyer_user.first_name} {buyer_user.last_name}" if buyer_user else "Valued Patron")

    subject = f"🎁 Order #{order.order_number} Is Packed & Quality Checked"
    preheader = f"Hello {customer_name}, your order #{order.order_number} has completed luxury packaging and is ready for courier dispatch."

    body = f"""
    <div style="text-align: center; margin-bottom: 20px;">
      <span style="display: inline-block; background-color: #FCE7F0; color: #D84B7E; font-weight: bold; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; padding: 6px 16px; border-radius: 20px;">
        Atelier Milestone
      </span>
      <h1 style="font-family: 'Georgia', serif; font-size: 22px; font-weight: 700; color: #111111; margin: 16px 0 8px 0;">
        Your Ritual Has Been Packed!
      </h1>
      <p style="font-size: 13px; line-height: 1.6; color: #555555; margin: 0 auto; max-width: 480px;">
        Hello {customer_name}, each botanical formula in order <strong>#{order.order_number}</strong> has passed our 10-point quality assurance check and is securely encased in luxury packaging.
      </p>
    </div>

    <div style="background-color: #FFF8FA; border: 1px solid #F1BCCE; border-radius: 16px; padding: 20px; text-align: center; margin: 24px 0;">
      <p style="font-size: 14px; font-weight: bold; color: #111111; margin: 0 0 6px 0;">Next Step: Courier Handover</p>
      <p style="font-size: 12px; color: #666666; margin: 0;">Our logistics team is handing over your parcel for express transit. You will receive an email with your AWB tracking link the moment the courier scans your package.</p>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="{frontend_url}/account" target="_blank" style="display: inline-block; background-color: #111111; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 30px; font-size: 12px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase;">
        View Order Timeline →
      </a>
    </div>
    """

    html = _base_layout(subject, preheader, body, frontend_url, footer_support_email="orders@yuraebeauty.com")
    text = f"Hello {customer_name},\n\nYour order #{order.order_number} is packed and quality-checked. Courier dispatch is imminent."
    return {"subject": subject, "html": html, "text": text}


# ==============================================================================
# 6. 🚚 ORDER SHIPPED & TRACKING (orders@yuraebeauty.com)
# ==============================================================================
def render_order_shipped(
    order: Any,
    tracking_info: Optional[Dict[str, Any]] = None,
    user: Optional[Any] = None,
    frontend_url: str = "https://yuraebeauty.com"
) -> Dict[str, str]:
    addr = getattr(order, 'address', None)
    buyer_user = user or getattr(order, 'user', None)
    customer_name = (addr.name if addr else None) or (f"{buyer_user.first_name} {buyer_user.last_name}" if buyer_user else "Valued Patron")

    info = tracking_info or {}
    awb = info.get("awb_code") or info.get("tracking_number") or getattr(order, 'awb_code', 'AWB-ASSIGNED')
    courier = info.get("courier_name") or getattr(order, 'courier_name', 'Express Luxury Logistics')
    tracking_url = info.get("tracking_url") or getattr(order, 'tracking_url', f"{frontend_url}/track/{order.order_number}")

    subject = f"🚚 Your Yurae Order #{order.order_number} Has Shipped! (AWB: {awb})"
    preheader = f"Exciting news {customer_name}! Your parcel #{order.order_number} is in transit via {courier}."

    body = f"""
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="display: inline-block; background-color: #FCE7F0; color: #D84B7E; font-weight: bold; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; padding: 6px 16px; border-radius: 20px;">
        On the Way
      </span>
      <h1 style="font-family: 'Georgia', serif; font-size: 22px; font-weight: 700; color: #111111; margin: 16px 0 8px 0;">
        Your Order is On Its Way!
      </h1>
      <p style="font-size: 13px; line-height: 1.6; color: #555555; margin: 0 auto; max-width: 480px;">
        Hello {customer_name}, order <strong>#{order.order_number}</strong> has been handed to our express delivery partner. Your botanicals are on their journey to your doorstep.
      </p>
    </div>

    <!-- Tracking Card -->
    <div style="background-color: #FFF8FA; border: 1px solid #F1BCCE; border-radius: 18px; padding: 24px 20px; text-align: center; margin: 24px 0;">
      <div style="font-size: 11px; color: #666666; text-transform: uppercase; letter-spacing: 1.5px;">Express Courier Partner</div>
      <div style="font-size: 16px; font-weight: bold; color: #111111; margin: 4px 0 14px 0;">{courier}</div>
      
      <div style="font-size: 11px; color: #666666; text-transform: uppercase; letter-spacing: 1.5px;">Waybill / AWB Number</div>
      <div style="font-family: 'Courier New', Courier, monospace; font-size: 20px; font-weight: 800; color: #D84B7E; margin: 4px 0 18px 0;">
        {awb}
      </div>

      <a href="{tracking_url}" target="_blank" style="display: inline-block; background-color: #D84B7E; color: #ffffff; text-decoration: none; padding: 13px 32px; border-radius: 30px; font-size: 12px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; box-shadow: 0 4px 15px rgba(216, 75, 126, 0.25);">
        Track Package Live →
      </a>
    </div>
    """

    html = _base_layout(subject, preheader, body, frontend_url, footer_support_email="orders@yuraebeauty.com")
    text = f"Hello {customer_name},\n\nYour order #{order.order_number} has shipped via {courier} (AWB: {awb}).\nTrack live at: {tracking_url}"
    return {"subject": subject, "html": html, "text": text}


# ==============================================================================
# 7. 🛵 OUT FOR DELIVERY (orders@yuraebeauty.com)
# ==============================================================================
def render_out_for_delivery(
    order: Any,
    tracking_info: Optional[Dict[str, Any]] = None,
    user: Optional[Any] = None,
    frontend_url: str = "https://yuraebeauty.com"
) -> Dict[str, str]:
    addr = getattr(order, 'address', None)
    buyer_user = user or getattr(order, 'user', None)
    customer_name = (addr.name if addr else None) or (f"{buyer_user.first_name} {buyer_user.last_name}" if buyer_user else "Valued Patron")

    subject = f"🛵 Out for Delivery Today: Your Yurae Parcel #{order.order_number}"
    preheader = f"Hello {customer_name}, your order #{order.order_number} is out for delivery with your local delivery associate."

    body = f"""
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="display: inline-block; background-color: #FFF0D6; color: #B7791F; font-weight: bold; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; padding: 6px 16px; border-radius: 20px;">
        Arriving Today
      </span>
      <h1 style="font-family: 'Georgia', serif; font-size: 22px; font-weight: 700; color: #111111; margin: 16px 0 8px 0;">
        Out for Delivery Today!
      </h1>
      <p style="font-size: 13px; line-height: 1.6; color: #555555; margin: 0 auto; max-width: 480px;">
        Hello {customer_name}, our courier partner is in your area today delivering order <strong>#{order.order_number}</strong>. Please ensure someone is available at your shipping address to receive the parcel.
      </p>
    </div>

    <div style="background-color: #FFF8FA; border: 1px solid #F1BCCE; border-radius: 16px; padding: 20px; margin: 20px 0; font-size: 13px; color: #444444; line-height: 1.7;">
      <strong>Delivery Checklist:</strong>
      <ul style="margin: 8px 0 0 0; padding-left: 20px;">
        <li>Please inspect the tamper-evident Yurae seal upon arrival.</li>
        {f'<li><strong>Amount to be paid (COD):</strong> {_format_currency(order.total_amount, order.currency)}</li>' if getattr(order, "is_cod", False) else '<li><strong>Payment Status:</strong> Fully Paid Online</li>'}
      </ul>
    </div>
    """

    html = _base_layout(subject, preheader, body, frontend_url, footer_support_email="orders@yuraebeauty.com")
    text = f"Hello {customer_name},\n\nYour order #{order.order_number} is out for delivery today!"
    return {"subject": subject, "html": html, "text": text}


# ==============================================================================
# 8. ✨ ORDER DELIVERED (orders@yuraebeauty.com)
# ==============================================================================
def render_order_delivered(
    order: Any,
    user: Optional[Any] = None,
    frontend_url: str = "https://yuraebeauty.com"
) -> Dict[str, str]:
    addr = getattr(order, 'address', None)
    buyer_user = user or getattr(order, 'user', None)
    customer_name = (addr.name if addr else None) or (f"{buyer_user.first_name} {buyer_user.last_name}" if buyer_user else "Valued Patron")

    subject = f"✨ Delivered: Your Yurae Skincare Ritual #{order.order_number}"
    preheader = f"Your order #{order.order_number} has been delivered. Enjoy your botanical ritual!"

    body = f"""
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="display: inline-block; background-color: #E6F7F0; color: #00875A; font-weight: bold; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; padding: 6px 16px; border-radius: 20px;">
        ✓ Package Delivered
      </span>
      <h1 style="font-family: 'Georgia', serif; font-size: 22px; font-weight: 700; color: #111111; margin: 16px 0 8px 0;">
        Your Ritual Has Arrived
      </h1>
      <p style="font-size: 13px; line-height: 1.6; color: #555555; margin: 0 auto; max-width: 480px;">
        Hello {customer_name}, courier records indicate that order <strong>#{order.order_number}</strong> was successfully delivered. We hope these botanical formulations elevate your daily ritual.
      </p>
    </div>

    <div style="background-color: #FFF8FA; border: 1px solid #F1BCCE; border-radius: 16px; padding: 22px; text-align: center; margin: 24px 0;">
      <h3 style="font-size: 15px; font-family: 'Georgia', serif; color: #111111; margin: 0 0 8px 0;">How was your experience?</h3>
      <p style="font-size: 12px; color: #666666; margin: 0 0 16px 0;">Your thoughts help refine our craftsmanship and guide fellow skincare seekers.</p>
      <a href="{frontend_url}/account" target="_blank" style="display: inline-block; background-color: #D84B7E; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 30px; font-size: 12px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase;">
        Share a Review ★★★★★
      </a>
    </div>
    """

    html = _base_layout(subject, preheader, body, frontend_url, footer_support_email="orders@yuraebeauty.com")
    text = f"Hello {customer_name},\n\nYour Yurae order #{order.order_number} was successfully delivered. Enjoy your ritual!"
    return {"subject": subject, "html": html, "text": text}


# ==============================================================================
# 9. ❌ ORDER CANCELLATION (orders@yuraebeauty.com)
# ==============================================================================
def render_order_cancelled(
    order: Any,
    reason: Optional[str] = None,
    user: Optional[Any] = None,
    frontend_url: str = "https://yuraebeauty.com"
) -> Dict[str, str]:
    addr = getattr(order, 'address', None)
    buyer_user = user or getattr(order, 'user', None)
    customer_name = (addr.name if addr else None) or (f"{buyer_user.first_name} {buyer_user.last_name}" if buyer_user else "Valued Patron")

    subject = f"Notice: Order #{order.order_number} Has Been Cancelled"
    preheader = f"Hello {customer_name}, your order #{order.order_number} has been cancelled."

    body = f"""
    <div style="text-align: center; margin-bottom: 20px;">
      <span style="display: inline-block; background-color: #FFEBE6; color: #DE350B; font-weight: bold; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; padding: 6px 16px; border-radius: 20px;">
        Order Cancelled
      </span>
      <h1 style="font-family: 'Georgia', serif; font-size: 22px; font-weight: 700; color: #111111; margin: 16px 0 8px 0;">
        Order #{order.order_number} Cancelled
      </h1>
      <p style="font-size: 13px; line-height: 1.6; color: #555555; margin: 0 auto; max-width: 480px;">
        Hello {customer_name}, this notification confirms that order <strong>#{order.order_number}</strong> has been cancelled.
      </p>
    </div>

    <div style="background-color: #FFF8FA; border: 1px solid #F1BCCE; border-radius: 14px; padding: 18px; margin: 20px 0; font-size: 13px; color: #444444; line-height: 1.6;">
      <strong>Reason:</strong> {reason or 'Customer request / Cancellation before dispatch'}<br>
      <strong>Refund Status:</strong> If any online payment was collected, a full refund has been initiated to your original payment method and should reflect within 3-5 business days.
    </div>
    """

    html = _base_layout(subject, preheader, body, frontend_url, footer_support_email="orders@yuraebeauty.com")
    text = f"Hello {customer_name},\n\nYour order #{order.order_number} has been cancelled. If payment was made, your refund is in process."
    return {"subject": subject, "html": html, "text": text}


# ==============================================================================
# 10. 💰 REFUND PROCESSED (orders@yuraebeauty.com)
# ==============================================================================
def render_refund_notification(
    order: Any,
    refund_record: Any,
    user: Optional[Any] = None,
    frontend_url: str = "https://yuraebeauty.com"
) -> Dict[str, str]:
    addr = getattr(order, 'address', None)
    buyer_user = user or getattr(order, 'user', None)
    customer_name = (addr.name if addr else None) or (f"{buyer_user.first_name} {buyer_user.last_name}" if buyer_user else "Valued Patron")

    amount = getattr(refund_record, 'amount', order.total_amount)
    currency = getattr(refund_record, 'currency', getattr(order, 'currency', 'INR'))
    rfd_num = getattr(refund_record, 'refund_number', 'RFD-PROCESSED')
    refund_mode = getattr(refund_record, 'refund_mode', 'Original Payment Method').replace('_', ' ').title()

    subject = f"💰 Refund Processed for Order #{order.order_number} ({_format_currency(amount, currency)})"
    preheader = f"Hello {customer_name}, a refund of {_format_currency(amount, currency)} has been issued for order #{order.order_number}."

    body = f"""
    <div style="text-align: center; margin-bottom: 20px;">
      <span style="display: inline-block; background-color: #E6F7F0; color: #00875A; font-weight: bold; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; padding: 6px 16px; border-radius: 20px;">
        Refund Confirmed
      </span>
      <h1 style="font-family: 'Georgia', serif; font-size: 22px; font-weight: 700; color: #111111; margin: 16px 0 8px 0;">
        Refund Completed
      </h1>
      <p style="font-size: 13px; line-height: 1.6; color: #555555; margin: 0 auto; max-width: 480px;">
        Hello {customer_name}, we have processed your refund for order <strong>#{order.order_number}</strong>.
      </p>
    </div>

    <div style="background-color: #FFF8FA; border: 1px solid #F1BCCE; border-radius: 16px; padding: 20px; margin: 20px 0;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 13px; line-height: 1.9; color: #444444;">
        <tr>
          <td><strong>Refund Reference:</strong></td>
          <td align="right" style="font-family: monospace; font-weight: bold;">{rfd_num}</td>
        </tr>
        <tr>
          <td><strong>Refund Amount:</strong></td>
          <td align="right" style="color: #D84B7E; font-weight: bold; font-size: 15px; font-family: monospace;">{_format_currency(amount, currency)}</td>
        </tr>
        <tr>
          <td><strong>Credit Mode:</strong></td>
          <td align="right">{refund_mode}</td>
        </tr>
      </table>
    </div>

    <p style="font-size: 12px; color: #777777; text-align: center;">
      Depending on your banking provider, please allow 3-5 business days for the funds to reflect on your statement.
    </p>
    """

    html = _base_layout(subject, preheader, body, frontend_url, footer_support_email="orders@yuraebeauty.com")
    text = f"Hello {customer_name},\n\nRefund of {_format_currency(amount, currency)} has been processed for order #{order.order_number} (Ref: {rfd_num})."
    return {"subject": subject, "html": html, "text": text}


# ==============================================================================
# 11. 💌 CONTACT FORM ACKNOWLEDGEMENT (support@yuraebeauty.com)
# ==============================================================================
def render_contact_acknowledgement(
    contact_message: Any,
    frontend_url: str = "https://yuraebeauty.com"
) -> Dict[str, str]:
    name = getattr(contact_message, 'name', 'Valued Patron')
    msg_id = getattr(contact_message, 'id', 'NEW')
    subject_input = getattr(contact_message, 'subject', 'General Inquiry') or 'Concierge Inquiry'

    subject = f"🌿 We Received Your Inquiry [Ticket #{msg_id}] — Yurae Concierge"
    preheader = f"Hello {name}, thank you for reaching out to Yurae. Our concierge team has received your message."

    body = f"""
    <div style="text-align: center; margin-bottom: 20px;">
      <span style="display: inline-block; background-color: #FCE7F0; color: #D84B7E; font-weight: bold; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; padding: 6px 16px; border-radius: 20px;">
        Concierge Support
      </span>
      <h1 style="font-family: 'Georgia', serif; font-size: 22px; font-weight: 700; color: #111111; margin: 16px 0 8px 0;">
        Message Received
      </h1>
      <p style="font-size: 13px; line-height: 1.6; color: #555555; margin: 0 auto; max-width: 480px;">
        Hello {name}, thank you for contacting Yurae Beauty. Our concierge specialists have logged your inquiry and will respond within 24 hours.
      </p>
    </div>

    <div style="background-color: #FFF8FA; border: 1px solid #F1BCCE; border-radius: 14px; padding: 18px; margin: 20px 0; font-size: 12px; color: #444444; line-height: 1.7;">
      <strong>Inquiry Subject:</strong> {subject_input}<br>
      <strong>Ticket Reference:</strong> #{msg_id}<br>
      <strong>Your Message:</strong><br>
      <div style="margin-top: 6px; padding: 10px; background-color: #ffffff; border-radius: 8px; border: 1px solid #FAF0F4; font-style: italic; color: #666666;">
        "{getattr(contact_message, 'message', '')}"
      </div>
    </div>
    """

    html = _base_layout(subject, preheader, body, frontend_url, footer_support_email="support@yuraebeauty.com")
    text = f"Hello {name},\n\nWe received your inquiry (Ticket #{msg_id}). Our concierge team will respond within 24 hours."
    return {"subject": subject, "html": html, "text": text}


# ==============================================================================
# 12. 🔔 ADMIN NEW ORDER NOTIFICATION (admin@yuraebeauty.com)
# ==============================================================================
def render_admin_order_alert(
    order: Any,
    user: Optional[Any] = None,
    admin_url: str = "https://yuraebeauty.com/admin"
) -> Dict[str, str]:
    addr = getattr(order, 'address', None)
    buyer_user = user or getattr(order, 'user', None)
    customer_name = (addr.name if addr else None) or (f"{buyer_user.first_name} {buyer_user.last_name}" if buyer_user else "Customer")
    customer_email = (buyer_user.email if buyer_user else None) or getattr(order, 'shipping_email', 'N/A')
    customer_phone = (addr.phone if addr else None) or (buyer_user.phone if buyer_user and buyer_user.phone else 'N/A')
    currency = getattr(order, 'currency', 'INR')

    subject = f"🔔 [New Order] #{order.order_number} — {_format_currency(order.total_amount, currency)} ({customer_name})"
    preheader = f"New order #{order.order_number} placed by {customer_name} ({customer_email}) for {_format_currency(order.total_amount, currency)}."

    items_rows = ""
    for item in getattr(order, 'items', []):
        items_rows += f"""
        <tr style="border-bottom: 1px solid #ECECEC;">
          <td style="padding: 8px 4px; font-size: 13px;"><b>{item.product_name}</b></td>
          <td align="center" style="padding: 8px 4px; font-size: 13px;">{item.quantity}</td>
          <td align="right" style="padding: 8px 4px; font-size: 13px; font-family: monospace;">{_format_currency(item.price * item.quantity, currency)}</td>
        </tr>
        """

    body = f"""
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #111111; padding-bottom: 12px; margin-bottom: 18px;">
      <h2 style="font-size: 18px; font-weight: bold; color: #111111; margin: 0;">🔔 New Store Order Received</h2>
      <span style="background-color: #111111; color: #ffffff; padding: 4px 10px; border-radius: 12px; font-size: 10px; font-weight: bold; text-transform: uppercase;">
        Atelier Dispatch
      </span>
    </div>

    <div style="background-color: #FFF8FA; border: 1px solid #F1BCCE; border-radius: 14px; padding: 16px; margin: 16px 0;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 13px; line-height: 1.8;">
        <tr>
          <td style="color: #666666;"><strong>Order Amount:</strong></td>
          <td align="right" style="color: #D84B7E; font-weight: bold; font-size: 15px; font-family: monospace;">{_format_currency(order.total_amount, currency)}</td>
        </tr>
        <tr>
          <td style="color: #666666;"><strong>Customer:</strong></td>
          <td align="right">{customer_name} (<a href="mailto:{customer_email}" style="color: #D84B7E;">{customer_email}</a>)</td>
        </tr>
        <tr>
          <td style="color: #666666;"><strong>Contact Phone:</strong></td>
          <td align="right">{customer_phone}</td>
        </tr>
        <tr>
          <td style="color: #666666;"><strong>Payment Status:</strong></td>
          <td align="right" style="font-weight: bold; color: #00875A;">{getattr(order, 'payment_status', 'Pending')}</td>
        </tr>
      </table>
    </div>

    <h4 style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #111111; margin: 16px 0 8px 0;">Items Ordered</h4>
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
      <thead>
        <tr style="border-bottom: 2px solid #E5E7EB; font-size: 11px; color: #888888; text-transform: uppercase;">
          <th align="left" style="padding: 6px 4px;">Item</th>
          <th align="center" style="padding: 6px 4px;">Qty</th>
          <th align="right" style="padding: 6px 4px;">Total</th>
        </tr>
      </thead>
      <tbody>
        {items_rows}
      </tbody>
    </table>

    <div style="text-align: center; margin-top: 24px;">
      <a href="{admin_url}" target="_blank" style="display: inline-block; background-color: #111111; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 24px; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">
        Open Admin Order Desk →
      </a>
    </div>
    """

    html = _base_layout(subject, preheader, body, admin_url, footer_support_email="admin@yuraebeauty.com")
    text = f"New Order Received: #{order.order_number} by {customer_name} for {_format_currency(order.total_amount, currency)}."
    return {"subject": subject, "html": html, "text": text}


# ==============================================================================
# 13. 📩 ADMIN CONTACT MESSAGE ALERT (admin@yuraebeauty.com)
# ==============================================================================
def render_admin_contact_alert(
    contact_message: Any,
    admin_url: str = "https://yuraebeauty.com/admin"
) -> Dict[str, str]:
    name = getattr(contact_message, 'name', 'Customer')
    email = getattr(contact_message, 'email', 'N/A')
    msg_id = getattr(contact_message, 'id', 'NEW')
    subject_in = getattr(contact_message, 'subject', 'General Inquiry') or 'Contact Form'

    subject = f"💬 [Customer Inquiry #{msg_id}] {subject_in} ({name})"
    preheader = f"New customer message from {name} ({email}) on Yurae Beauty."

    body = f"""
    <div style="border-bottom: 2px solid #111111; padding-bottom: 12px; margin-bottom: 16px;">
      <h2 style="font-size: 18px; font-weight: bold; color: #111111; margin: 0;">💬 New Customer Inquiry Received</h2>
    </div>

    <div style="background-color: #FFF8FA; border: 1px solid #F1BCCE; border-radius: 14px; padding: 16px; margin: 16px 0; font-size: 13px; line-height: 1.8;">
      <strong>Customer:</strong> {name}<br>
      <strong>Email:</strong> <a href="mailto:{email}" style="color: #D84B7E;">{email}</a><br>
      <strong>Phone:</strong> {getattr(contact_message, 'phone', 'N/A')}<br>
      <strong>Subject:</strong> {subject_in}<br>
      <strong>Message:</strong>
      <div style="margin-top: 8px; padding: 12px; background: #ffffff; border-radius: 8px; border: 1px solid #F1BCCE; font-style: italic; color: #333333;">
        "{getattr(contact_message, 'message', '')}"
      </div>
    </div>

    <div style="text-align: center; margin-top: 20px;">
      <a href="mailto:{email}?subject=Re:%20{subject_in}%20-%20Yurae%20Concierge" style="display: inline-block; background-color: #D84B7E; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 24px; font-size: 12px; font-weight: bold; text-transform: uppercase;">
        Reply Directly to Customer →
      </a>
    </div>
    """

    html = _base_layout(subject, preheader, body, admin_url, footer_support_email="admin@yuraebeauty.com")
    text = f"New customer inquiry #{msg_id} from {name} ({email}):\n\n{getattr(contact_message, 'message', '')}"
    return {"subject": subject, "html": html, "text": text}


# ==============================================================================
# 14. 📣 BACK IN STOCK ALERT (marketing@yuraebeauty.com)
# ==============================================================================
def render_back_in_stock_alert(
    product_name: str,
    variant_value: Optional[str] = None,
    product_url: Optional[str] = None,
    frontend_url: str = "https://yuraebeauty.com"
) -> Dict[str, str]:
    size_label = f" ({variant_value})" if variant_value else ""
    target_url = product_url or f"{frontend_url}/shop"

    subject = f"✨ Back in Stock: {product_name}{size_label} Is Available Now!"
    preheader = f"You asked to be notified! {product_name} is back in stock at Yurae Beauty."

    body = f"""
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="display: inline-block; background-color: #FCE7F0; color: #D84B7E; font-weight: bold; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; padding: 6px 16px; border-radius: 20px;">
        Restocked Selection
      </span>
      <h1 style="font-family: 'Georgia', serif; font-size: 22px; font-weight: 700; color: #111111; margin: 16px 0 8px 0;">
        It's Finally Back in Stock!
      </h1>
      <p style="font-size: 13px; line-height: 1.6; color: #555555; margin: 0 auto; max-width: 480px;">
        You reserved a priority notification for <strong>{product_name}{size_label}</strong>. Our atelier has replenished inventory, and your piece is ready for dispatch.
      </p>
    </div>

    <div style="background-color: #FFF8FA; border: 1px solid #F1BCCE; border-radius: 16px; padding: 24px; text-align: center; margin: 24px 0;">
      <div style="font-size: 11px; color: #D84B7E; text-transform: uppercase; letter-spacing: 1.5px; font-weight: bold;">Priority Access</div>
      <div style="font-size: 18px; font-weight: bold; color: #111111; margin: 6px 0 16px 0;">{product_name}{size_label}</div>
      <a href="{target_url}" target="_blank" style="display: inline-block; background-color: #D84B7E; color: #ffffff; text-decoration: none; padding: 14px 34px; border-radius: 30px; font-size: 13px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; box-shadow: 0 4px 15px rgba(216, 75, 126, 0.25);">
        Complete Your Order Now →
      </a>
    </div>

    <p style="font-size: 11px; color: #888888; text-align: center; margin: 0;">
      Quantities are limited in this batch. We recommend securing yours promptly.
    </p>
    """

    html = _base_layout(subject, preheader, body, frontend_url, footer_support_email="support@yuraebeauty.com", show_unsubscribe=True)
    text = f"Great news! {product_name}{size_label} is back in stock. Order now at: {target_url}"
    return {"subject": subject, "html": html, "text": text}


# ==============================================================================
# 15. 💌 CONCIERGE SUPPORT REPLY TO CUSTOMER (support@yuraebeauty.com)
# ==============================================================================
def render_contact_reply(
    contact_message: Any,
    reply_text: str,
    frontend_url: str = "https://yuraebeauty.com"
) -> Dict[str, str]:
    name = getattr(contact_message, 'name', 'Valued Patron')
    msg_id = getattr(contact_message, 'id', 'NEW')
    subject_input = getattr(contact_message, 'subject', 'General Inquiry') or 'Concierge Consultation'

    subject = f"Re: {subject_input} [Ticket #{msg_id}] — Yurae Concierge"
    preheader = f"Hello {name}, our concierge team has replied to your inquiry."

    formatted_reply = reply_text.replace("\n", "<br>")

    body = f"""
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="display: inline-block; background-color: #FCE7F0; color: #D84B7E; font-weight: bold; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; padding: 6px 16px; border-radius: 20px;">
        Concierge Response
      </span>
      <h1 style="font-family: 'Georgia', serif; font-size: 22px; font-weight: 700; color: #111111; margin: 16px 0 8px 0;">
        Hello {name},
      </h1>
      <p style="font-size: 13px; line-height: 1.6; color: #555555; margin: 0 auto; max-width: 480px;">
        Thank you for contacting Yurae Beauty. Our concierge atelier has reviewed your message regarding <strong>"{subject_input}"</strong>.
      </p>
    </div>

    <!-- Official Response Box -->
    <div style="background-color: #FFF8FA; border: 1px solid #F1BCCE; border-radius: 18px; padding: 24px 20px; margin: 24px 0;">
      <div style="font-size: 11px; color: #D84B7E; text-transform: uppercase; letter-spacing: 1.5px; font-weight: bold; margin-bottom: 10px;">
        Official Response from Yurae Concierge:
      </div>
      <div style="font-size: 14px; line-height: 1.8; color: #222222;">
        {formatted_reply}
      </div>
    </div>

    <!-- Original Inquiry Quote Box -->
    <div style="background-color: #FAFAFA; border: 1px solid #EEEEEE; border-radius: 12px; padding: 14px 16px; margin: 20px 0; font-size: 12px; line-height: 1.6; color: #666666;">
      <strong style="color: #444444;">Your Original Message (Ticket #{msg_id}):</strong><br>
      <span style="font-style: italic;">"{getattr(contact_message, 'message', '')}"</span>
    </div>

    <p style="font-size: 12px; color: #777777; line-height: 1.6; text-align: center; margin-top: 24px;">
      If you have further questions or wish to continue the conversation, simply reply directly to this email.
    </p>

    <div style="text-align: center; margin-top: 20px;">
      <a href="{frontend_url}/shop" target="_blank" style="display: inline-block; background-color: #D84B7E; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 30px; font-size: 12px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; box-shadow: 0 4px 15px rgba(216, 75, 126, 0.25);">
        Explore Yurae Formulations →
      </a>
    </div>
    """

    html = _base_layout(subject, preheader, body, frontend_url, footer_support_email="support@yuraebeauty.com")
    text = f"Hello {name},\n\nOur response to your inquiry #{msg_id}:\n\n{reply_text}\n\nOriginal Message:\n{getattr(contact_message, 'message', '')}\n\nBest regards,\nYurae Concierge Atelier"
    return {"subject": subject, "html": html, "text": text}

