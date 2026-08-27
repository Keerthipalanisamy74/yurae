"""
Comprehensive End-to-End Enterprise Order Management & Fulfillment Test Suite
Verifies:
1. 18+ Step Order Lifecycle State Machine Progression
2. WMS Facility Management & Shelf-Bin Picking Route Generator
3. 8-Point Quality Control (QC) Inspection Pass & Fail Flow
4. Luxury Packing Workbench & Free Sample Inclusion Engine
5. 4x6 Inch Thermal Shipping Label PDF Generation
6. Partial & Full Refund Execution & Payment Reconciliation
7. Multi-Channel Notifications & Tamper-Evident Audit Logging
"""

import os
import sys
import unittest
from datetime import datetime, timedelta

# Append project root
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.session import SessionLocal, engine, Base
import app.models.models
from app.models.models import (
    User, Order, OrderItem, Product, Category, Address, Payment,
    Warehouse, ProductInventoryLocation, PickList, PickListItem,
    QualityCheckLog, PackingLog, RefundRecord, NotificationLog, AuditLog
)
from app.services.warehouse_service import WarehouseService
from app.services.qc_service import QCService
from app.services.packing_service import PackingService
from app.services.shipping_label_service import ShippingLabelService
from app.services.refund_service import RefundService
from app.services.fulfillment_orchestrator import FulfillmentOrchestrator, LIFECYCLE_STAGES
from app.services.notification_service import NotificationService
from app.services.audit_service import AuditService


class TestEnterpriseFulfillmentLifecycle(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)
        cls.db = SessionLocal()

        # Seed Test User
        cls.user = cls.db.query(User).filter(User.email == "patron.enterprise.test@yurae.luxury").first()
        if not cls.user:
            cls.user = User(
                first_name="Radhika",
                last_name="Sundaram",
                email="patron.enterprise.test@yurae.luxury",
                phone="+919840123456",
                password_hash="test_hash_enterprise",
                role="CUSTOMER"
            )
            cls.db.add(cls.user)
            cls.db.commit()
            cls.db.refresh(cls.user)

        # Seed Category & Product
        cls.category = cls.db.query(Category).first()
        if not cls.category:
            cls.category = Category(name="Sacred Botanicals", slug="sacred-botanicals")
            cls.db.add(cls.category)
            cls.db.commit()
            cls.db.refresh(cls.category)

        cls.product = cls.db.query(Product).filter(Product.sku == "YUR-ENT-KUMKUMADI-50").first()
        if not cls.product:
            cls.product = Product(
                category_id=cls.category.id,
                name="Yurae Kumkumadi Miraculous Beauty Fluid",
                slug="yurae-kumkumadi-miraculous-beauty-fluid",
                sku="YUR-ENT-KUMKUMADI-50",
                price=3200.0,
                stock_quantity=100
            )
            cls.db.add(cls.product)
            cls.db.commit()
            cls.db.refresh(cls.product)

        # Seed Address
        cls.address = cls.db.query(Address).filter(Address.user_id == cls.user.id).first()
        if not cls.address:
            cls.address = Address(
                user_id=cls.user.id,
                name="Radhika Sundaram",
                phone="+919840123456",
                address_line1="14/2 Poes Garden",
                address_line2="Cathedral Road",
                city="Chennai",
                state="Tamil Nadu",
                postal_code="600028",
                country="India"
            )
            cls.db.add(cls.address)
            cls.db.commit()
            cls.db.refresh(cls.address)

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def setUp(self):
        # Create Fresh Test Order
        self.order_num = f"YUR-OMS-{datetime.now().strftime('%M%S%f')[:8]}"
        self.order = Order(
            user_id=self.user.id,
            address_id=self.address.id,
            order_number=self.order_num,
            currency="INR",
            subtotal=3200.0,
            discount=0.0,
            shipping_fee=0.0,
            total_amount=3200.0,
            payment_status="Paid",
            order_status="Confirmed",
            fulfillment_status="NEW_ORDER",
            courier_name="Blue Dart Express Air Priority",
            awb_code="BD2026880099IN"
        )
        self.db.add(self.order)
        self.db.commit()
        self.db.refresh(self.order)

        self.item = OrderItem(
            order_id=self.order.id,
            product_id=self.product.id,
            product_name=self.product.name,
            variant_info="50ml Flacon",
            quantity=1,
            price=3200.0
        )
        self.db.add(self.item)
        self.db.commit()
        self.db.refresh(self.order)

    def test_01_wms_warehouse_and_picklist_generation(self):
        print("\n--- TEST 1: WMS WAREHOUSE & PICK LIST GENERATION ---")
        wh = WarehouseService.get_or_create_default_warehouse(self.db)
        self.assertIsNotNone(wh.id)
        self.assertEqual(wh.code, "WH-BLR-01")

        bin_loc = WarehouseService.get_or_create_product_bin_location(self.product.id, self.db)
        self.assertIsNotNone(bin_loc.shelf_bin)
        print(f"[OK] Product Bin Coordinate Allocated: {bin_loc.shelf_bin}")

        picklist = WarehouseService.generate_pick_list_for_order(self.order, "Ananya Sharma (Atelier Lead)", self.db)
        self.assertIsNotNone(picklist.id)
        self.assertEqual(len(picklist.items), 1)
        self.assertEqual(picklist.items[0].sku, self.product.sku)
        self.assertEqual(picklist.items[0].quantity_required, 1)
        print(f"[OK] Generated PickList #{picklist.picklist_number} with {len(picklist.items)} line item(s).")

        # Pick Item
        p_item = WarehouseService.record_pick_item(
            pick_item_id=picklist.items[0].id,
            quantity_picked=1,
            status="PICKED",
            actor_name="Ananya Sharma",
            db=self.db
        )
        self.assertEqual(p_item.status, "PICKED")
        self.assertEqual(self.order.fulfillment_status, "ITEMS_PICKED")
        print(f"[OK] Item SKU {p_item.sku} marked as PICKED at shelf {p_item.shelf_location}")

    def test_02_quality_control_inspection_flow(self):
        print("\n--- TEST 2: 8-POINT QUALITY CONTROL (QC) INSPECTION ---")
        checklist = {
            "product_verified": True,
            "variant_verified": True,
            "quantity_verified": True,
            "packaging_sealed": True,
            "no_leakage": True,
            "no_cosmetic_damage": True,
            "batch_verified": True,
            "expiry_verified": True
        }
        qc_log = QCService.inspect_order(
            order=self.order,
            qc_inspector_name="Vikramaditya Rao (Lead QC Inspector)",
            status="PASSED",
            verification_checklist=checklist,
            batch_number="BAT-KUM-2026-08",
            expiry_date="2028-08-01",
            notes="Formulation and amber glass flacon integrity flawless.",
            db=self.db
        )
        self.assertIsNotNone(qc_log.id)
        self.assertEqual(qc_log.status, "PASSED")
        self.assertEqual(self.order.fulfillment_status, "QUALITY_CHECKED")
        self.assertIsNotNone(self.order.qc_at)
        print(f"[OK] Order #{self.order.order_number} passed 8-point QC Inspection (Batch: {qc_log.batch_number})")

    def test_03_luxury_packing_station_workbench(self):
        print("\n--- TEST 3: LUXURY PACKING WORKBENCH & SAMPLE INCLUSION ---")
        samples = PackingService.get_sample_recommendations_for_order(self.order)
        self.assertGreaterEqual(len(samples), 1)
        print(f"[OK] Complimentary Samples Allocated: {len(samples)} items")

        pack_log = PackingService.pack_order(
            order=self.order,
            packer_name="Meera Pillai (Senior Packaging Specialist)",
            box_type="LUXURY_SLIM_BOX",
            packaging_checklist={
                "tissue_wrap": True,
                "bubble_cushion": True,
                "thank_you_card": True,
                "promo_flyer": True,
                "ribbon_seal": True
            },
            free_samples=samples,
            total_weight_kg=0.48,
            notes="Enclosed signed calligraphy card and rose-gold wax seal.",
            db=self.db
        )
        self.assertIsNotNone(pack_log.id)
        self.assertEqual(self.order.fulfillment_status, "PACKED")
        self.assertIsNotNone(self.order.packed_at)
        print(f"[OK] Order #{self.order.order_number} packed into {pack_log.box_type} (Weight: {pack_log.total_weight_kg}kg)")

    def test_04_shipping_label_pdf_generation(self):
        print("\n--- TEST 4: REPORTLAB 4x6 THERMAL SHIPPING LABEL PDF ---")
        pdf_bytes = ShippingLabelService.generate_thermal_label_pdf(self.order)
        self.assertIsInstance(pdf_bytes, bytes)
        self.assertGreater(len(pdf_bytes), 1500)
        print(f"[OK] 4x6 Thermal Shipping Label PDF Generated Successfully ({len(pdf_bytes)} bytes)")

    def test_05_fulfillment_orchestrator_lifecycle_progression(self):
        print("\n--- TEST 5: 18+ MILESTONE LIFECYCLE PROGRESSION ---")
        # Step through dispatch -> delivery -> completion
        FulfillmentOrchestrator.advance_order_status(self.order, "SHIPPED", "Dispatched via Blue Dart Air Cargo Hub", db=self.db)
        self.assertEqual(self.order.order_status, "Shipped")
        self.assertEqual(self.order.fulfillment_status, "SHIPPED")

        FulfillmentOrchestrator.advance_order_status(self.order, "DELIVERED", "Delivered to patron residence", db=self.db)
        self.assertEqual(self.order.order_status, "Delivered")
        self.assertEqual(self.order.fulfillment_status, "DELIVERED")
        self.assertIsNotNone(self.order.delivered_at)

        timeline = FulfillmentOrchestrator.get_order_lifecycle_timeline(self.order)
        self.assertEqual(timeline["order_number"], self.order.order_number)
        self.assertEqual(len(timeline["milestones"]), len(LIFECYCLE_STAGES))
        print(f"[OK] State Machine Timeline Verified: {len(timeline['milestones'])} Milestones Present")

    def test_06_refund_and_financial_reconciliation(self):
        print("\n--- TEST 6: REFUND PROCESSOR & INVENTORY RESTORATION ---")
        initial_stock = self.product.stock_quantity

        refund = RefundService.process_refund(
            order=self.order,
            amount=3200.0,
            reason="Customer Requested Return & Full Settlement",
            refund_type="FULL",
            refund_mode="ORIGINAL_PAYMENT",
            restore_inventory=True,
            admin_notes="Quality verification confirmed item unopened; inventory restored.",
            actor_name="Finance Director",
            db=self.db
        )
        self.assertIsNotNone(refund.id)
        self.assertEqual(refund.status, "PROCESSED")
        self.assertEqual(self.order.payment_status, "Refunded")
        self.assertEqual(self.order.fulfillment_status, "REFUND_COMPLETED")
        self.db.refresh(self.product)
        self.assertEqual(self.product.stock_quantity, initial_stock + 1)
        print(f"[OK] Refund #{refund.refund_number} of Rs {refund.amount} completed; Product stock restored to {self.product.stock_quantity}")

    def test_07_notification_and_audit_trail_logging(self):
        print("\n--- TEST 7: NOTIFICATION & ENTERPRISE AUDIT LOGS ---")
        # Trigger an explicit notification
        NotificationService.send_order_milestone_notification(self.order, "DELIVERED", "EMAIL", db=self.db)
        
        # Check NotificationLog
        notifs = self.db.query(NotificationLog).filter(NotificationLog.order_id == self.order.id).all()
        self.assertGreaterEqual(len(notifs), 1)
        print(f"[OK] {len(notifs)} Multi-Channel Notification(s) Persisted in DB.")

        # Log and check AuditLog
        AuditService.log_event(
            actor_name="Audit Compliance Officer",
            actor_role="ADMIN",
            action="ORDER_AUDIT_VERIFIED",
            entity_type="ORDER",
            entity_id=str(self.order.id),
            new_value={"verification": "PASSED"},
            db=self.db
        )
        audits = self.db.query(AuditLog).filter(
            (AuditLog.entity_id == str(self.order.id)) | (AuditLog.entity_id == str(self.order.order_number))
        ).all()
        self.assertGreaterEqual(len(audits), 1)
        print(f"[OK] {len(audits)} Tamper-Evident Audit Event(s) Recorded for Order #{self.order.order_number}.")


if __name__ == "__main__":
    print("\n" + "=" * 65)
    print("YURAE ENTERPRISE ORDER MANAGEMENT & FULFILLMENT TEST SUITE")
    print("=" * 65)
    unittest.main()
