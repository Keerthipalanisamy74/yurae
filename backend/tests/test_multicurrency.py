import sys
import unittest
from pathlib import Path

# Ensure backend directory in sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.services.exchange_rate_service import ExchangeRateService, CURRENCY_METADATA
from app.services.shipping_service import ShippingService
from app.services.payment_service import PaymentService, RazorpayPaymentProvider, StripePaymentProvider, PayPalPaymentProvider

class TestMultiCurrencyEngine(unittest.TestCase):
    def test_supported_currencies_list(self):
        """Verify all 8 core currencies are configured and registered with symbols and metadata."""
        expected_currencies = ["INR", "USD", "EUR", "GBP", "CAD", "AUD", "SGD", "JPY"]
        supported = ExchangeRateService.get_supported_currency_codes()
        for cur in expected_currencies:
            self.assertIn(cur, supported)
            meta = ExchangeRateService.get_currency_info(cur)
            self.assertIsNotNone(meta)
            self.assertTrue(len(meta["symbol"]) > 0)
            self.assertTrue(len(meta["flag"]) > 0)

    def test_same_currency_conversion(self):
        """Converting same currency (e.g. INR -> INR) must return the identical amount."""
        amount = 999.0
        converted = ExchangeRateService.convert_amount(amount, "INR", "INR")
        self.assertEqual(converted, 999.0)

        usd_amount = 45.50
        converted_usd = ExchangeRateService.convert_amount(usd_amount, "USD", "USD")
        self.assertEqual(converted_usd, 45.50)

    def test_jpy_zero_decimal_precision(self):
        """Japanese Yen (JPY) must round to 0 decimal places according to standard banking rules."""
        inr_amount = 1000.0
        jpy_converted = ExchangeRateService.convert_amount(inr_amount, "INR", "JPY")
        self.assertEqual(jpy_converted, round(jpy_converted, 0))
        meta = CURRENCY_METADATA.get("JPY")
        self.assertEqual(meta["decimal_digits"], 0)

    def test_cross_currency_conversion(self):
        """Verify cross currency conversion (e.g. INR -> USD, INR -> EUR, USD -> EUR)."""
        rates = ExchangeRateService.get_rates()
        self.assertIn("USD", rates)
        self.assertIn("EUR", rates)

        inr_base = 1000.0
        usd_val = ExchangeRateService.convert_amount(inr_base, "INR", "USD")
        self.assertGreater(usd_val, 0.0)

        # Reverse conversion approximately matches
        inr_back = ExchangeRateService.convert_amount(usd_val, "USD", "INR")
        self.assertAlmostEqual(inr_base, inr_back, delta=5.0)

    def test_shipping_service_zones(self):
        """Test international and domestic shipping calculation."""
        # India domestic under threshold
        in_res = ShippingService.calculate_shipping(country="India", subtotal=500.0, target_currency="INR")
        self.assertFalse(in_res["is_free"])
        self.assertEqual(in_res["shipping_fee"], 99.0)

        # India domestic above free threshold
        in_free = ShippingService.calculate_shipping(country="India", subtotal=2000.0, target_currency="INR")
        self.assertTrue(in_free["is_free"])
        self.assertEqual(in_free["shipping_fee"], 0.0)

        # US shipping
        us_res = ShippingService.calculate_shipping(country="United States", subtotal=25.0, target_currency="USD")
        self.assertFalse(us_res["is_free"])
        self.assertEqual(us_res["shipping_fee"], 15.0)

    def test_payment_provider_abstraction(self):
        """Test payment provider resolution for India vs Global."""
        # India INR -> Razorpay
        inr_prov = PaymentService.get_provider("Razorpay", "INR")
        self.assertIsInstance(inr_prov, RazorpayPaymentProvider)

        # Global USD -> Stripe
        stripe_prov = PaymentService.get_provider("Stripe", "USD")
        self.assertIsInstance(stripe_prov, StripePaymentProvider)

        # Global PayPal -> PayPal
        paypal_prov = PaymentService.get_provider("PayPal", "EUR")
        self.assertIsInstance(paypal_prov, PayPalPaymentProvider)

        # Process payment intent
        res = PaymentService.process_checkout_payment(
            payment_method="Stripe",
            amount=45.0,
            currency="USD",
            order_number="YURAE-20260819-TEST",
            customer_info={"name": "Test Client", "email": "client@example.com"}
        )
        self.assertTrue(res.success)
        self.assertTrue(res.payment_id.startswith("pi_stripe_"))

if __name__ == "__main__":
    unittest.main(verbosity=2)
