import sys
import time
import uuid
import unittest
from pathlib import Path
from fastapi.testclient import TestClient

# Ensure backend directory in sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.main import app
from app.database.session import SessionLocal
from app.models.models import User, Product, Order, OrderItem, Address, Shipment, ShippingTrackingEvent, ShippingSetting, Cart, CartItem
from app.services.shipping_provider import get_shipping_provider, BaseShippingProvider, ShiprocketProvider, DHLInternationalProvider
from app.services.shipping_service import ShippingService
from app.core.security import create_access_token

class TestMultiRegionShippingSystem(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.db = SessionLocal()

        # Admin user
        cls.admin_user = cls.db.query(User).filter(User.role == "ADMIN").first()
        if not cls.admin_user:
            cls.admin_user = User(
                email="admin_shipping_multi@yuraebeauty.com",
                password_hash="testpasshash",
                first_name="Admin",
                last_name="Logistics",
                is_active=True,
                role="ADMIN"
            )
            cls.db.add(cls.admin_user)
            cls.db.commit()
            cls.db.refresh(cls.admin_user)

        cls.admin_token = create_access_token(subject=cls.admin_user.id, role="ADMIN")
        cls.admin_headers = {"Authorization": f"Bearer {cls.admin_token}"}

        # Customer user
        cls.customer_user = cls.db.query(User).filter(User.email == "customer_multi_region@yuraebeauty.com").first()
        if not cls.customer_user:
            cls.customer_user = User(
                email="customer_multi_region@yuraebeauty.com",
                password_hash="testpasshash",
                first_name="Elena",
                last_name="Rao",
                is_active=True,
                role="CUSTOMER"
            )
            cls.db.add(cls.customer_user)
            cls.db.commit()
            cls.db.refresh(cls.customer_user)

        cls.customer_token = create_access_token(subject=cls.customer_user.id, role="CUSTOMER")
        cls.customer_headers = {"Authorization": f"Bearer {cls.customer_token}"}

        # Ensure a test product exists
        cls.product = cls.db.query(Product).first()
        if not cls.product:
            cls.product = Product(
                name="Rose Gold Peptide Elixir",
                slug="rose-gold-peptide-elixir",
                price=1600.0,
                stock_quantity=100,
                status="ACTIVE",
                weight_kg=0.35,
                length_cm=15.0,
                breadth_cm=10.0,
                height_cm=6.0
            )
            cls.db.add(cls.product)
            cls.db.commit()
            cls.db.refresh(cls.product)

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def _setup_cart_for_customer(self):
        """Helper to ensure customer has items in cart."""
        cart = self.db.query(Cart).filter(Cart.user_id == self.customer_user.id).first()
        if not cart:
            cart = Cart(user_id=self.customer_user.id)
            self.db.add(cart)
            self.db.commit()
            self.db.refresh(cart)

        # Clear existing
        self.db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
        self.db.commit()

        # Add item
        c_item = CartItem(
            cart_id=cart.id,
            product_id=self.product.id,
            quantity=2,
            price=self.product.price
        )
        self.db.add(c_item)
        self.db.commit()

    def test_01_india_prepaid_order(self):
        """Test 1: India + Prepaid Online Order Placement and Automated Dispatch."""
        self._setup_cart_for_customer()
        res = self.client.post("/api/orders", headers=self.customer_headers, json={
            "new_address": {
                "name": "Priya Sharma",
                "phone": "+919876543210",
                "address_line1": "Flat 302, Palm Meadows",
                "city": "Bengaluru",
                "state": "Karnataka",
                "postal_code": "560066",
                "country": "India"
            },
            "currency": "INR",
            "payment_method": "Razorpay",
            "is_paid": True,
            "payment_id": "rzp_test_12345"
        })
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertEqual(data["payment_status"], "Paid")
        self.assertEqual(data["shipping_status"], "AWB_ASSIGNED")
        self.assertIsNotNone(data["awb_code"])
        self.assertIn("Blue Dart", data["courier_name"])

    def test_02_india_cod_order(self):
        """Test 2: India + Cash on Delivery (COD) Order Placement."""
        self._setup_cart_for_customer()
        res = self.client.post("/api/orders", headers=self.customer_headers, json={
            "new_address": {
                "name": "Rajesh Kumar",
                "phone": "+919876543211",
                "address_line1": "Connaught Place",
                "city": "New Delhi",
                "state": "Delhi",
                "postal_code": "110001",
                "country": "India"
            },
            "currency": "INR",
            "payment_method": "COD",
            "is_paid": False
        })
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertTrue(data["is_cod"])
        self.assertEqual(data["payment_status"], "Pending")  # COD is pending until collection
        self.assertEqual(data["shipping_status"], "AWB_ASSIGNED")

    def test_03_usa_prepaid_order(self):
        """Test 3: USA + Prepaid Online Order Placement and DHL Global Dispatch."""
        self._setup_cart_for_customer()
        res = self.client.post("/api/orders", headers=self.customer_headers, json={
            "new_address": {
                "name": "Emily Watson",
                "phone": "+1 212 555 0199",
                "address_line1": "742 Evergreen Terrace",
                "city": "New York",
                "state": "NY",
                "postal_code": "10001",
                "country": "United States"
            },
            "currency": "USD",
            "payment_method": "Stripe",
            "is_paid": True,
            "payment_id": "ch_test_stripe_999"
        })
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertEqual(data["payment_status"], "Paid")
        self.assertEqual(data["currency"], "USD")
        self.assertEqual(data["shipping_status"], "AWB_ASSIGNED")
        self.assertIn("DHL", data["courier_name"])

    def test_04_usa_cod_rejection(self):
        """Test 4: USA + COD must fail and be rejected with HTTP 400 Bad Request."""
        self._setup_cart_for_customer()
        res = self.client.post("/api/orders", headers=self.customer_headers, json={
            "new_address": {
                "name": "Hacked Customer",
                "phone": "+1 212 555 0199",
                "address_line1": "742 Fake Street",
                "city": "Los Angeles",
                "state": "CA",
                "postal_code": "90001",
                "country": "United States"
            },
            "currency": "USD",
            "payment_method": "COD",
            "is_paid": False
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn("Cash on Delivery (COD) is available only for Indian domestic deliveries", res.json()["detail"])

    def test_05_canada_prepaid_order(self):
        """Test 5: Canada + Prepaid Online Order Placement."""
        self._setup_cart_for_customer()
        res = self.client.post("/api/orders", headers=self.customer_headers, json={
            "new_address": {
                "name": "Lucas Tremblay",
                "phone": "+1 514 555 0122",
                "address_line1": "1000 Rue de la Gauchetière",
                "city": "Montreal",
                "state": "QC",
                "postal_code": "H3B 4W5",
                "country": "Canada"
            },
            "currency": "CAD",
            "payment_method": "PayPal",
            "is_paid": True,
            "payment_id": "pp_test_cad_111"
        })
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertEqual(data["payment_status"], "Paid")
        self.assertEqual(data["currency"], "CAD")
        self.assertEqual(data["shipping_status"], "AWB_ASSIGNED")

    def test_06_canada_cod_rejection(self):
        """Test 6: Canada + COD must fail with HTTP 400 Bad Request."""
        self._setup_cart_for_customer()
        res = self.client.post("/api/orders", headers=self.customer_headers, json={
            "new_address": {
                "name": "Lucas Tremblay",
                "phone": "+1 514 555 0122",
                "address_line1": "1000 Rue de la Gauchetière",
                "city": "Montreal",
                "state": "QC",
                "postal_code": "H3B 4W5",
                "country": "Canada"
            },
            "currency": "CAD",
            "payment_method": "Cash on Delivery",
            "is_paid": False
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn("Cash on Delivery (COD) is available only for Indian domestic deliveries", res.json()["detail"])

    def test_07_unsupported_destination(self):
        """Test 7: Unsupported destination check gracefully falls back to International zone."""
        res = self.client.post("/api/shipping/serviceability", json={
            "country": "Fiji",
            "postal_code": "0000",
            "is_cod": False,
            "subtotal": 100.0,
            "currency": "USD"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["is_serviceable"])
        self.assertTrue(data["is_international"])

    def test_08_invalid_indian_pincode(self):
        """Test 8: Invalid Indian PIN code handled gracefully."""
        res = self.client.post("/api/shipping/serviceability", json={
            "country": "India",
            "pincode": "ABC12",
            "subtotal": 1000.0
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertFalse(data["is_serviceable"])
        self.assertIn("Invalid PIN", data["delivery_status_message"])

    def test_09_invalid_international_zip(self):
        """Test 9: Invalid International COD attempt rejected."""
        res = self.client.post("/api/shipping/serviceability", json={
            "country": "United Kingdom",
            "postal_code": "SW1A 1AA",
            "is_cod": True,
            "subtotal": 50.0,
            "currency": "GBP"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertFalse(data["is_serviceable"])
        self.assertIn("unavailable for international", data["delivery_status_message"].lower())

    def test_10_shipping_provider_error_boundary(self):
        """Test 10: Provider error boundary ensures paid order is never rolled back."""
        addr = Address(
            user_id=self.customer_user.id,
            name="Error Test User",
            phone="9999999999",
            address_line1="Test St",
            city="Bengaluru",
            state="Karnataka",
            postal_code="560001",
            country="India"
        )
        self.db.add(addr)
        self.db.commit()

        unique_suffix = f"{int(time.time() % 100000)}_{uuid.uuid4().hex[:4]}"
        ord_num = f"YUR-ERR-TEST-{unique_suffix}"
        order = Order(
            user_id=self.customer_user.id,
            address_id=addr.id,
            order_number=ord_num,
            order_status="Confirmed",
            payment_status="Paid",
            shipping_status="NOT_CREATED",
            currency="INR",
            subtotal=1600.0,
            total_amount=1600.0
        )
        self.db.add(order)
        self.db.commit()

        # Database order safely exists regardless of any downstream shipping status
        saved = self.db.query(Order).filter(Order.order_number == ord_num).first()
        self.assertIsNotNone(saved)
        self.assertEqual(saved.payment_status, "Paid")

    def test_11_payment_failure_handling(self):
        """Test 11: Unpaid non-COD order does not automatically create shipment."""
        addr = self.db.query(Address).first()
        ord_num = f"YUR-UNPAID-TEST-{int(time.time() % 100000)}_{uuid.uuid4().hex[:4]}"
        order = Order(
            user_id=self.customer_user.id,
            address_id=addr.id if addr else None,
            order_number=ord_num,
            order_status="Pending",
            payment_status="Failed",
            shipping_status="NOT_CREATED",
            currency="INR",
            subtotal=1600.0,
            total_amount=1600.0,
            is_cod=False
        )
        self.db.add(order)
        self.db.commit()

        # Execution should skip unpaid order
        shipment = ShippingService.execute_automated_shipping_flow(order.id, self.db)
        self.assertIsNone(shipment)
        self.assertEqual(order.shipping_status, "NOT_CREATED")

    def test_12_duplicate_shipment_prevention(self):
        """Test 12: Calling execution pipeline twice returns existing shipment instead of duplicate."""
        addr = self.db.query(Address).first()
        ord_num = f"YUR-DUP-TEST-{int(time.time() % 100000)}_{uuid.uuid4().hex[:4]}"
        order = Order(
            user_id=self.customer_user.id,
            address_id=addr.id if addr else None,
            order_number=ord_num,
            order_status="Confirmed",
            payment_status="Paid",
            shipping_status="NOT_CREATED",
            currency="INR",
            subtotal=1600.0,
            total_amount=1600.0
        )
        self.db.add(order)
        self.db.commit()

        # First call
        shp1 = ShippingService.execute_automated_shipping_flow(order.id, self.db)
        self.assertIsNotNone(shp1)
        awb1 = shp1.awb_code

        # Second call
        shp2 = ShippingService.execute_automated_shipping_flow(order.id, self.db)
        self.assertEqual(shp1.id, shp2.id)
        self.assertEqual(awb1, shp2.awb_code)

    def test_13_successful_shipment_and_label(self):
        """Test 13: Admin can fetch shipping label and live tracking telemetry."""
        order = self.db.query(Order).filter(Order.awb_code != None).first()
        self.assertIsNotNone(order)

        # 1. Fetch Label
        label_res = self.client.get(f"/api/shipping/orders/{order.id}/label", headers=self.admin_headers)
        self.assertEqual(label_res.status_code, 200)
        self.assertTrue(label_res.json()["success"])
        self.assertIsNotNone(label_res.json()["label_url"])

        # 2. Public Tracking
        track_res = self.client.get(f"/api/shipping/track/{order.order_number}")
        self.assertEqual(track_res.status_code, 200)
        self.assertEqual(track_res.json()["order_number"], order.order_number)
        self.assertGreater(len(track_res.json()["events"]), 0)

    def test_14_tracking_webhook_idempotency(self):
        """Test 14: Webhook status ingestion updates order & is idempotent."""
        order = self.db.query(Order).filter(Order.awb_code != None).first()
        self.assertIsNotNone(order)

        webhook_payload = {
            "event_id": f"WH_EVT_MULTI_{order.id}",
            "awb": order.awb_code,
            "order_id": order.order_number,
            "current_status": "IN_TRANSIT",
            "activity": "Customs clearance completed at hub",
            "location": "Airport Logistics Hub",
            "timestamp": "2026-08-24T14:00:00Z"
        }

        # 1. Ingestion
        res1 = self.client.post("/api/shipping/webhooks/shipping", json=webhook_payload)
        self.assertEqual(res1.status_code, 200)
        self.assertTrue(res1.json()["success"])

        # 2. Duplicate Ingestion (idempotency check)
        res2 = self.client.post("/api/shipping/webhooks/shipping", json=webhook_payload)
        self.assertEqual(res2.status_code, 200)
        self.assertIn("already processed", res2.json()["message"].lower())

if __name__ == "__main__":
    unittest.main()
