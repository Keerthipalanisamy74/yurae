import os
import sys

# Ensure backend and root paths are in sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
for p in [current_dir, parent_dir, os.path.join(parent_dir, "backend")]:
    if p not in sys.path:
        sys.path.insert(0, p)

from fastapi.testclient import TestClient
try:
    from app.main import app
    from app.database.session import SessionLocal, engine, Base
    from app.database.seed import seed_db
except ImportError:
    from backend.app.main import app
    from backend.app.database.session import SessionLocal, engine, Base
    from backend.app.database.seed import seed_db


print("--- Initializing test environment ---")
# Re-seed DB to clean state
seed_db()

client = TestClient(app)

print("\n1. Testing Health & Root API:")
res = client.get("/api/health")
print("GET /api/health:", res.status_code, res.json())
assert res.status_code == 200

print("\n2. Testing Categories:")
res = client.get("/api/categories")
print("GET /api/categories:", res.status_code, f"({len(res.json())} categories)")
assert res.status_code == 200

print("\n3. Testing Products:")
res = client.get("/api/products")
print("GET /api/products:", res.status_code, f"({len(res.json())} products)")
assert res.status_code == 200

print("\n4. Testing Auth - Customer Login:")
res = client.post("/api/auth/login", json={"email": "customer@yuraebeauty.com", "password": "Customer@123"})
print("POST /api/auth/login:", res.status_code)
assert res.status_code == 200
customer_token = res.json()["access_token"]
customer_headers = {"Authorization": f"Bearer {customer_token}"}

print("\n5. Testing Auth - Admin Login:")
res = client.post("/api/auth/login", json={"email": "admin@yuraebeauty.com", "password": "Admin@123"})
print("POST /api/auth/login (Admin):", res.status_code)
assert res.status_code == 200
admin_token = res.json()["access_token"]
admin_headers = {"Authorization": f"Bearer {admin_token}"}

print("\n6. Testing Auth - Change Password:")
res = client.post("/api/auth/change-password", json={
    "current_password": "Customer@123",
    "new_password": "Customer@New123"
}, headers=customer_headers)
print("POST /api/auth/change-password:", res.status_code, res.json())
assert res.status_code == 200

# Change it back
client.post("/api/auth/change-password", json={
    "current_password": "Customer@New123",
    "new_password": "Customer@123"
}, headers=customer_headers)

print("\n7. Testing Cart Operations:")
# Get products to add to cart
products = client.get("/api/products").json()
prod_id = products[0]["id"]

res = client.post("/api/cart/items", json={"product_id": prod_id, "quantity": 2}, headers=customer_headers)
print("POST /api/cart/items:", res.status_code, f"(items: {len(res.json()['items'])})")
assert res.status_code == 200

res = client.get("/api/cart", headers=customer_headers)
print("GET /api/cart:", res.status_code, f"(subtotal: {res.json()['subtotal']})")
assert res.status_code == 200

print("\n8. Testing Wishlist Operations:")
res = client.post("/api/wishlist", json={"product_id": prod_id}, headers=customer_headers)
print("POST /api/wishlist:", res.status_code)
assert res.status_code in [200, 201]

res = client.get("/api/wishlist", headers=customer_headers)
print("GET /api/wishlist:", res.status_code, f"({len(res.json())} items)")
assert res.status_code == 200

print("\n9. Testing Coupons:")
res = client.post("/api/coupons/apply", json={"code": "YURAE10", "subtotal": 2000.0})
print("POST /api/coupons/apply (YURAE10):", res.status_code, res.json()["message"], "discount:", res.json()["discount_amount"])
assert res.status_code == 200
assert res.json()["valid"] is True

print("\n10. Testing Admin Dashboard:")
res = client.get("/api/admin/dashboard", headers=admin_headers)
print("GET /api/admin/dashboard:", res.status_code, res.json())
assert res.status_code == 200

res = client.get("/api/admin/inventory", headers=admin_headers)
print("GET /api/admin/inventory:", res.status_code, f"({len(res.json())} inventory records)")
assert res.status_code == 200

print("\n=== ALL BACKEND API TESTS PASSED PERFECTLY! ===")
