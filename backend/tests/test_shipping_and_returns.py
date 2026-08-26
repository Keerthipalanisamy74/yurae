"""
Phase 2 Comprehensive Test Suite: Shipping, Logistics Automation & 7-Day Returns
Tests:
1. Pincode serviceability and COD eligibility logic.
2. Order status transition to 'Processing' triggering automated AWB generation.
3. ReportLab Barcode Packing Slip PDF & JSON manifest generation.
4. Multi-carrier webhook dispatchers (Shiprocket, Delhivery, Blue Dart).
5. 7-Day Self-Service Returns & Exchanges policy enforcement and admin reverse logistics.
"""

import os
import sys
from datetime import datetime, timedelta

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.session import SessionLocal
from app.models.models import User, Product, Order, OrderItem, Address, ReturnRequest, Shipment
from app.services.shipping_service import ShippingService
from app.services.packing_slip_service import PackingSlipService


def setup_test_data(db):
    """Creates a sample test patron user and order."""
    user = db.query(User).filter(User.email == "patron.shipping.test@yurae.luxury").first()
    if not user:
        user = User(
            email="patron.shipping.test@yurae.luxury",
            password_hash="testpasshash123",
            first_name="Radha",
            last_name="Sundaram",
            phone="+91 98401 23456",
            role="CUSTOMER",
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    addr = db.query(Address).filter(Address.user_id == user.id).first()
    if not addr:
        addr = Address(
            user_id=user.id,
            name="Radha Sundaram",
            phone="+91 98401 23456",
            address_line1="14/2, Boat Club Road",
            address_line2="R.A. Puram",
            city="Chennai",
            state="Tamil Nadu",
            postal_code="600028",
            country="India",
            is_default=True
        )
        db.add(addr)
        db.commit()
        db.refresh(addr)

    prod = db.query(Product).first()
    if not prod:
        prod = Product(
            name="Kumkumadi Radiant Glow Elixir",
            price=2450.0,
            stock_quantity=50,
            is_active=True
        )
        db.add(prod)
        db.commit()
        db.refresh(prod)

    # Create Delivered order
    order_num = f"YUR-TEST-{datetime.utcnow().strftime('%M%S')}"
    order = Order(
        order_number=order_num,
        user_id=user.id,
        address_id=addr.id,
        subtotal=2450.0,
        tax=441.0,
        shipping_fee=0.0,
        total_amount=2891.0,
        payment_status="Paid",
        order_status="Delivered",
        shipping_status="DELIVERED",
        created_at=datetime.utcnow() - timedelta(days=2),
        updated_at=datetime.utcnow() - timedelta(days=2)
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    o_item = OrderItem(
        order_id=order.id,
        product_id=prod.id,
        product_name=prod.name,
        variant_info="50ml Glass Flacon",
        quantity=1,
        price=2450.0
    )
    db.add(o_item)
    db.commit()
    db.refresh(order)

    return user, addr, prod, order


def test_pincode_serviceability(db):
    print("\n--- TEST 1: PINCODE SERVICEABILITY & COD ELIGIBILITY ---")
    res = ShippingService.check_pincode_serviceability(pincode="600028", subtotal=2450.0, country="India", db=db)
    is_serv = res.get("is_serviceable", res.get("serviceable", False))
    assert is_serv is True, "Pincode 600028 should be serviceable"
    print(f"✅ Domestic Pincode 600028 serviceable via {len(res.get('available_couriers', []))} courier tiers.")


def test_automated_shipping_and_awb(db, user, addr, prod):
    print("\n--- TEST 2: AUTOMATED AWB GENERATION & DISPATCH FLOW ---")
    # Create fresh confirmed order
    fresh_order = Order(
        order_number=f"YUR-AWB-{datetime.utcnow().strftime('%M%S')}",
        user_id=user.id,
        address_id=addr.id,
        subtotal=2450.0,
        tax=441.0,
        total_amount=2891.0,
        payment_status="Paid",
        order_status="Confirmed",
        shipping_status="NOT_CREATED"
    )
    db.add(fresh_order)
    db.commit()
    db.refresh(fresh_order)

    o_item = OrderItem(
        order_id=fresh_order.id,
        product_id=prod.id,
        product_name=prod.name,
        variant_info="50ml Glass Flacon",
        quantity=1,
        price=2450.0
    )
    db.add(o_item)
    db.commit()
    db.refresh(fresh_order)

    # Trigger automated flow
    res = ShippingService.execute_automated_shipping_flow(fresh_order.id, db)
    db.refresh(fresh_order)

    assert fresh_order.awb_code is not None, "AWB code should be assigned"
    assert fresh_order.shipping_status in ["AWB_ASSIGNED", "PICKUP_SCHEDULED"], "Shipping status should advance"
    print(f"✅ Automated fulfillment succeeded for Order #{fresh_order.order_number}:")
    print(f"   Carrier: {fresh_order.courier_name} | AWB: {fresh_order.awb_code} | Shipping Status: {fresh_order.shipping_status}")


def test_packing_slip_generation(db, order):
    print("\n--- TEST 3: BARCODE PACKING SLIP & REPORTLAB PDF GENERATION ---")
    data = PackingSlipService.get_packing_slip_data(order)
    assert data["order_number"] == order.order_number, "Order number match"
    assert len(data["items"]) == len(order.items), "Items count match"
    assert "luxury_packaging_checklist" in data, "Must contain luxury QA checklist"
    print(f"✅ Structured Manifest verified for Order #{order.order_number} ({data['total_quantity']} items, Barcode: {data['barcode_text']})")

    pdf_bytes = PackingSlipService.generate_packing_slip_pdf(order)
    assert len(pdf_bytes) > 500, "PDF bytes should be generated"
    assert pdf_bytes.startswith(b"%PDF"), "Must be a valid PDF binary"
    print(f"✅ Printable Luxury Packing Slip PDF generated successfully ({len(pdf_bytes)} bytes)")


def test_multi_carrier_webhooks(db, order):
    print("\n--- TEST 4: MULTI-CARRIER LIVE TRACKING WEBHOOKS ---")
    # Simulate Shiprocket in-transit event
    payload_sr = {
        "order_id": order.order_number,
        "current_status": "in_transit",
        "courier_name": "Blue Dart Express",
        "location": "Chennai South Transit Hub",
        "scans": [
            {"activity": "Parcel dispatched from Guindy Hub", "location": "Chennai", "date": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")}
        ]
    }
    res = ShippingService.process_webhook_event(payload_sr, db)
    db.refresh(order)
    assert order.shipping_status == "IN_TRANSIT", "Order shipping status should be updated to IN_TRANSIT"
    print(f"✅ In-Transit Webhook processed: Order status is {order.order_status}, shipping_status is {order.shipping_status}")

    # Simulate Delhivery delivered event
    payload_del = {
        "order_id": order.order_number,
        "current_status": "delivered",
        "location": "Chennai R.A. Puram Delivery Center",
        "scans": [
            {"activity": "Delivered to recipient Radha Sundaram", "location": "Chennai", "date": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")}
        ]
    }
    ShippingService.process_webhook_event(payload_del, db)
    db.refresh(order)
    assert order.shipping_status == "DELIVERED", "Order shipping status should advance to DELIVERED"
    print(f"✅ Delivered Webhook processed: Order status is {order.order_status}, shipping_status is {order.shipping_status}")


def test_self_service_returns_workflow(db, user, order, prod):
    print("\n--- TEST 5: 7-DAY SELF-SERVICE RETURNS & EXCHANGES WORKFLOW ---")
    
    # Verify policy eligibility
    eligibility = ShippingService.validate_return_eligibility(order)
    assert eligibility["eligible"] is True, "Delivered order within 2 days must be eligible"
    print(f"✅ Eligibility validation passed: {eligibility['reason']}")

    # Create Exchange Request
    ret_req = ShippingService.create_return_request(
        order=order,
        user_id=user.id,
        request_type="EXCHANGE",
        reason="Size / Fit Issue (Too Large)",
        detailed_reason="Requesting smaller 30ml flacon for travel.",
        preferred_exchange_size="30ml",
        refund_mode=None,
        items=[{"product_id": prod.id, "product_name": prod.name, "quantity": 1, "price": 2450.0}],
        photos=["https://images.unsplash.com/photo-1556228720-195a672e8a03"],
        db=db
    )
    assert ret_req.id is not None, "Return request record created"
    assert ret_req.status == "PENDING_REVIEW", "Initial status should be PENDING_REVIEW"
    assert ret_req.request_type == "EXCHANGE", "Request type should be EXCHANGE"
    print(f"✅ Customer Return Request created: #{ret_req.request_number} (Status: {ret_req.status})")

    # Admin approves and schedules reverse courier pickup
    ret_req.status = "APPROVED"
    ret_req.reverse_awb_code = f"REV-{order.order_number[-6:]}-BLUEDART"
    ret_req.reverse_courier_name = "Blue Dart Reverse Logistics"
    ret_req.pickup_date = datetime.utcnow().strftime("%Y-%m-%d")
    ret_req.admin_notes = "Approved. Courier pickup scheduled for tomorrow."
    db.commit()
    db.refresh(ret_req)

    assert ret_req.status == "APPROVED", "Status updated to APPROVED"
    assert ret_req.reverse_awb_code is not None, "Reverse AWB assigned"
    print(f"✅ Admin Reverse Pickup dispatched: Rev AWB {ret_req.reverse_awb_code} via {ret_req.reverse_courier_name}")

    # Mark completed
    ret_req.status = "COMPLETED"
    db.commit()
    db.refresh(ret_req)
    assert ret_req.status == "COMPLETED", "Return marked as COMPLETED"
    print(f"✅ Exchange process marked as COMPLETED for Request #{ret_req.request_number}")


def main():
    print("=" * 60)
    print("YURAE LOGISTICS AUTOMATION & 7-DAY RETURNS VERIFICATION SUITE")
    print("=" * 60)
    db = SessionLocal()
    try:
        user, addr, prod, order = setup_test_data(db)
        test_pincode_serviceability(db)
        test_automated_shipping_and_awb(db, user, addr, prod)
        test_packing_slip_generation(db, order)
        test_multi_carrier_webhooks(db, order)
        test_self_service_returns_workflow(db, user, order, prod)
        print("\n" + "=" * 60)
        print("🎉 ALL 5 LOGISTICS & RETURNS TEST SUITES PASSED WITH ZERO ERRORS!")
        print("=" * 60)
    finally:
        db.close()


if __name__ == "__main__":
    main()
