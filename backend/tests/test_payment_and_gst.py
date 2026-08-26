import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import hmac
import hashlib
import time
from app.services.payment_service import RazorpayPaymentProvider, StripePaymentProvider, PaymentService
from app.services.invoice_pdf_service import InvoicePdfService

def test_razorpay_signature():
    rzp = RazorpayPaymentProvider()
    rzp.key_id = "rzp_live_real_id"
    rzp.key_secret = "test_secret_123"
    order_id = "order_test_12345"
    payment_id = "pay_test_67890"

    msg = f"{order_id}|{payment_id}".encode("utf-8")
    valid_sig = hmac.new(b"test_secret_123", msg, hashlib.sha256).hexdigest()

    res_valid = rzp.verify_payment(payment_id, order_id, {"razorpay_signature": valid_sig})
    assert res_valid.success is True, "Valid Razorpay signature should pass"

    res_invalid = rzp.verify_payment(payment_id, order_id, {"razorpay_signature": "tampered_signature_hex"})
    assert res_invalid.success is False, "Tampered Razorpay signature must fail"
    print("[PASS] Razorpay HMAC-SHA256 signature verification test PASSED")

def test_stripe_webhook_signature():
    stripe = StripePaymentProvider()
    stripe.webhook_secret = "whsec_test_secret_abc123"
    raw_body = b'{"type": "payment_intent.succeeded", "data": {"object": {"id": "pi_123"}}}'
    now_t = str(int(time.time()))

    sig_to_sign = f"{now_t}.".encode("utf-8") + raw_body
    v1_sig = hmac.new(b"whsec_test_secret_abc123", sig_to_sign, hashlib.sha256).hexdigest()
    valid_header = f"t={now_t},v1={v1_sig}"

    assert stripe.verify_webhook_signature(raw_body, valid_header) is True, "Valid Stripe signature must pass"
    assert stripe.verify_webhook_signature(raw_body, f"t={now_t},v1=invalid_sig") is False, "Tampered Stripe signature must fail"
    print("[PASS] Stripe timestamped webhook signature verification test PASSED")

def test_invoice_pdf_rendering():
    class DummyItem:
        product_name = "Mulberry Silk Midi Dress"
        variant_info = "Size: M"
        quantity = 2
        price = 4500.0

    class DummyAddress:
        name = "Kavya Sundaram"
        phone = "+91 98765 43210"
        address_line1 = "12, Poes Garden"
        address_line2 = "Near Park"
        city = "Chennai"
        state = "Tamil Nadu"
        postal_code = "600086"
        country = "India"

    class DummyOrder:
        order_number = "YURAE-20260826-TEST01"
        created_at = None
        currency = "INR"
        subtotal = 9000.0
        discount = 500.0
        shipping_fee = 0.0
        tax = 1530.0
        total_amount = 10030.0
        payment_status = "Paid"
        order_status = "Confirmed"
        is_cod = False
        address = DummyAddress()
        items = [DummyItem()]
        payments = []
        user = None

    pdf_bytes = InvoicePdfService.generate_order_invoice_pdf(DummyOrder())
    assert len(pdf_bytes) > 1000, "Generated PDF should be at least 1KB"
    assert pdf_bytes.startswith(b"%PDF"), "Output should be a valid PDF binary stream"
    print("[PASS] Luxury Tax Invoice PDF generation & ReportLab compilation test PASSED")

if __name__ == "__main__":
    test_razorpay_signature()
    test_stripe_webhook_signature()
    test_invoice_pdf_rendering()
    print("\nALL PAYMENT GATEWAY & FINANCIAL INFRASTRUCTURE UNIT TESTS PASSED SUCCESSFULLY!")
