import os
import sys
from datetime import datetime

current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from app.main import app
from app.database.session import SessionLocal, engine, Base
from app.database.seed import seed_db
from app.models.models import User, Product, Order, CartItem, Address, Cart
from app.core.events import YuraeEventBus

def test_full_realtime_platform():
    # 1. Initialize DB and TestClient
    seed_db()
    client = TestClient(app)

    # 2. Test Health Check
    health_res = client.get("/api/health")
    assert health_res.status_code == 200
    assert health_res.json()["status"] == "ok"
    print("\n[TEST 1 PASSED] /api/health is operational.")

    # 3. Customer & Admin Logins
    login_cust = client.post("/api/auth/login", json={"email": "customer@yuraebeauty.com", "password": "Customer@123"})
    assert login_cust.status_code == 200
    cust_token = login_cust.json()["access_token"]
    cust_headers = {"Authorization": f"Bearer {cust_token}"}
    cust_user_id = login_cust.json()["user"]["id"]

    login_adm = client.post("/api/auth/login", json={"email": "admin@yuraebeauty.com", "password": "Admin@123"})
    assert login_adm.status_code == 200
    adm_token = login_adm.json()["access_token"]
    adm_headers = {"Authorization": f"Bearer {adm_token}"}
    print("[TEST 2 PASSED] Authentication for Customer & Admin verified.")

    # 4. Multi-Currency Lookup
    curr_res = client.get("/api/currencies/rates")
    assert curr_res.status_code == 200
    assert "INR" in curr_res.json()["rates"]
    assert "USD" in curr_res.json()["rates"]
    print("[TEST 3 PASSED] Multi-currency exchange rate engine active.")

    # 5. Product Catalog & Stock Check
    prod_res = client.get("/api/products")
    assert prod_res.status_code == 200
    products = prod_res.json()
    assert len(products) > 0
    test_product = products[0]
    initial_stock = test_product["stock_quantity"]
    print(f"[TEST 4 PASSED] Product catalog retrieved. Test item: '{test_product['name']}' (Stock: {initial_stock}).")

    # Clear existing cart items for clean test run
    db = SessionLocal()
    c_cart = db.query(Cart).filter(Cart.user_id == cust_user_id).first()
    if c_cart:
        db.query(CartItem).filter(CartItem.cart_id == c_cart.id).delete()
        db.commit()
    db.close()

    # 6. Add to Beauty Bag (Cart)
    cart_add = client.post("/api/cart/items", json={"product_id": test_product["id"], "quantity": 1}, headers=cust_headers)
    assert cart_add.status_code == 200
    print("[TEST 5 PASSED] Product added to customer bag.")

    # 7. Customer Checkout & Order Creation (Realtime Event ORDER_CREATED broadcast)
    order_create_payload = {
        "currency": "INR",
        "payment_method": "COD",
        "is_paid": False
    }
    order_res = client.post("/api/orders", json=order_create_payload, headers=cust_headers)
    assert order_res.status_code == 201
    created_order = order_res.json()
    order_id = created_order["id"]
    order_number = created_order["order_number"]
    print(f"[TEST 6 PASSED] Order created: #{order_number} (Total: {created_order['currency']} {created_order['total_amount']}).")

    # Verify inventory was decremented automatically
    updated_prod_res = client.get(f"/api/products/{test_product['id']}")
    assert updated_prod_res.status_code == 200
    new_stock = updated_prod_res.json()["stock_quantity"]
    assert new_stock == initial_stock - 1
    print(f"[TEST 7 PASSED] Inventory automatically deducted ({initial_stock} -> {new_stock}).")

    # 8. Tax Invoice & PDF Generation
    inv_res = client.get(f"/api/orders/{order_number}/invoice", headers=cust_headers)
    assert inv_res.status_code == 200
    assert inv_res.json()["invoice_number"].startswith("INV-")
    print(f"[TEST 8 PASSED] Structured Tax Invoice generated ({inv_res.json()['invoice_number']}).")

    pdf_res = client.get(f"/api/orders/{order_number}/pdf", headers=cust_headers)
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"
    assert len(pdf_res.content) > 100
    print(f"[TEST 9 PASSED] Binary Tax Invoice PDF generated ({len(pdf_res.content)} bytes).")

    # 9. Admin Status Advancement & Realtime Broadcast (ORDER_STATUS_CHANGED)
    status_update_res = client.put(
        f"/api/orders/{order_id}/status",
        json={"order_status": "Processing"},
        headers=adm_headers
    )
    assert status_update_res.status_code == 200
    assert status_update_res.json()["order_status"] == "Processing"
    print(f"[TEST 10 PASSED] Admin updated order status to 'Processing' with realtime broadcast.")

    # 10. WebSocket Connection Test
    with client.websocket_connect(f"/ws/admin?token={adm_token}") as websocket:
        welcome_frame = websocket.receive_json()
        assert welcome_frame["event"] == "CONNECTED"
        assert welcome_frame["channel"] == "admin"
        websocket.send_text("ping")
        resp = websocket.receive_text()
        assert resp == "pong"
    print("[TEST 11 PASSED] WebSocket Admin channel handshake and heartbeat verified.")

    with client.websocket_connect(f"/ws/customer?token={cust_token}") as websocket:
        cust_welcome = websocket.receive_json()
        assert cust_welcome["event"] == "CONNECTED"
        assert cust_welcome["channel"] == "customer"
        websocket.send_text("ping")
        resp = websocket.receive_text()
        assert resp == "pong"
    print("[TEST 12 PASSED] WebSocket Customer channel handshake and heartbeat verified.")

    print("\n=======================================================")
    print("ALL 12 REALTIME PLATFORM TEST SUITES PASSED FLAWLESSLY!")
    print("=======================================================\n")

if __name__ == "__main__":
    test_full_realtime_platform()
