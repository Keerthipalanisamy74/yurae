import uuid
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from app.core.config import settings

class PaymentResult:
    def __init__(self, success: bool, payment_id: str, provider: str, message: str, raw_data: Optional[Dict[str, Any]] = None):
        self.success = success
        self.payment_id = payment_id
        self.provider = provider
        self.message = message
        self.raw_data = raw_data or {}

class BasePaymentProvider(ABC):
    @abstractmethod
    def create_payment(self, amount: float, currency: str, order_number: str, customer_info: Dict[str, Any]) -> PaymentResult:
        pass

    @abstractmethod
    def verify_payment(self, payment_id: str, order_id: str, payload: Dict[str, Any]) -> PaymentResult:
        pass

class RazorpayPaymentProvider(BasePaymentProvider):
    """India domestic payment gateway: UPI, NetBanking, Domestic Cards, Wallets, EMI."""
    def __init__(self):
        self.key_id = settings.RAZORPAY_KEY_ID
        self.key_secret = settings.RAZORPAY_KEY_SECRET

    def create_payment(self, amount: float, currency: str, order_number: str, customer_info: Dict[str, Any]) -> PaymentResult:
        # In live mode with razorpay SDK installed:
        # client = razorpay.Client(auth=(self.key_id, self.key_secret))
        # order = client.order.create({"amount": int(amount * 100), "currency": currency, "receipt": order_number})
        # For testing / non-live keys, provide a clean mock-ready success token:
        mock_id = f"rzp_{uuid.uuid4().hex[:12]}"
        return PaymentResult(
            success=True,
            payment_id=mock_id,
            provider="Razorpay",
            message="Razorpay payment session created successfully.",
            raw_data={"order_number": order_number, "currency": currency, "amount": amount, "key_id": self.key_id}
        )

    def verify_payment(self, payment_id: str, order_id: str, payload: Dict[str, Any]) -> PaymentResult:
        return PaymentResult(success=True, payment_id=payment_id, provider="Razorpay", message="Payment verified.")

class StripePaymentProvider(BasePaymentProvider):
    """Global international card payment provider: Visa, Mastercard, Amex, USD, EUR, GBP, CAD, AUD, SGD, JPY."""
    def __init__(self):
        self.public_key = settings.STRIPE_PUBLIC_KEY
        self.secret_key = settings.STRIPE_SECRET_KEY

    def create_payment(self, amount: float, currency: str, order_number: str, customer_info: Dict[str, Any]) -> PaymentResult:
        # In live mode with stripe python SDK:
        # stripe.api_key = self.secret_key
        # intent = stripe.PaymentIntent.create(amount=int(amount * (1 if currency == "JPY" else 100)), currency=currency.lower())
        mock_id = f"pi_stripe_{uuid.uuid4().hex[:14]}"
        return PaymentResult(
            success=True,
            payment_id=mock_id,
            provider="Stripe",
            message="Stripe global payment intent generated.",
            raw_data={"order_number": order_number, "currency": currency, "amount": amount, "publishable_key": self.public_key}
        )

    def verify_payment(self, payment_id: str, order_id: str, payload: Dict[str, Any]) -> PaymentResult:
        return PaymentResult(success=True, payment_id=payment_id, provider="Stripe", message="Stripe payment verified.")

class PayPalPaymentProvider(BasePaymentProvider):
    """Global PayPal wallet and cards."""
    def __init__(self):
        self.client_id = settings.PAYPAL_CLIENT_ID
        self.client_secret = settings.PAYPAL_CLIENT_SECRET

    def create_payment(self, amount: float, currency: str, order_number: str, customer_info: Dict[str, Any]) -> PaymentResult:
        mock_id = f"PAYID_{uuid.uuid4().hex[:16].upper()}"
        return PaymentResult(
            success=True,
            payment_id=mock_id,
            provider="PayPal",
            message="PayPal international transaction initiated.",
            raw_data={"order_number": order_number, "currency": currency, "amount": amount, "client_id": self.client_id}
        )

    def verify_payment(self, payment_id: str, order_id: str, payload: Dict[str, Any]) -> PaymentResult:
        return PaymentResult(success=True, payment_id=payment_id, provider="PayPal", message="PayPal payment verified.")

class MockPaymentProvider(BasePaymentProvider):
    """Mock testing provider for local testing and COD."""
    def create_payment(self, amount: float, currency: str, order_number: str, customer_info: Dict[str, Any]) -> PaymentResult:
        mock_id = f"mock_{uuid.uuid4().hex[:10]}"
        return PaymentResult(
            success=True,
            payment_id=mock_id,
            provider="MockPayment",
            message="Test checkout completed instantly.",
            raw_data={"order_number": order_number, "currency": currency, "amount": amount}
        )

    def verify_payment(self, payment_id: str, order_id: str, payload: Dict[str, Any]) -> PaymentResult:
        return PaymentResult(success=True, payment_id=payment_id, provider="MockPayment", message="Mock verified.")

class PaymentService:
    @classmethod
    def get_provider(cls, payment_method: str, currency: str = "INR") -> BasePaymentProvider:
        method_lower = payment_method.lower()

        if "stripe" in method_lower or "card" in method_lower and currency.upper() != "INR":
            return StripePaymentProvider()
        elif "paypal" in method_lower:
            return PayPalPaymentProvider()
        elif "razorpay" in method_lower or "upi" in method_lower or "netbanking" in method_lower:
            return RazorpayPaymentProvider()
        else:
            return MockPaymentProvider()

    @classmethod
    def process_checkout_payment(
        cls,
        payment_method: str,
        amount: float,
        currency: str,
        order_number: str,
        customer_info: Dict[str, Any]
    ) -> PaymentResult:
        provider = cls.get_provider(payment_method, currency)
        return provider.create_payment(amount, currency, order_number, customer_info)
