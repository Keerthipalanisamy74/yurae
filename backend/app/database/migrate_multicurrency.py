import sys
from pathlib import Path
backend_dir = Path(__file__).resolve().parent.parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from sqlalchemy import text
from app.database.session import engine, Base
from app.models.models import ExchangeRate

def run_multicurrency_migration():
    print("[INFO] Starting multi-currency database migration...")
    
    # 1. Ensure all new tables are created (including exchange_rates)
    Base.metadata.create_all(bind=engine)
    print("[INFO] Created new tables if they did not exist.")

    # 2. Add columns if missing in MySQL
    with engine.connect() as conn:
        # Check and add base_currency to products
        try:
            conn.execute(text("ALTER TABLE products ADD COLUMN base_currency VARCHAR(10) DEFAULT 'INR' NOT NULL;"))
            conn.commit()
            print("[SUCCESS] Added 'base_currency' column to 'products'.")
        except Exception as e:
            if "Duplicate column" in str(e) or "already exists" in str(e) or "1060" in str(e):
                print("[INFO] Column 'base_currency' already exists in 'products'.")
            else:
                print(f"[WARNING] Warning adding base_currency: {e}")

        # Check and add currency, exchange_rate, tax to orders
        try:
            conn.execute(text("ALTER TABLE orders ADD COLUMN currency VARCHAR(10) DEFAULT 'INR' NOT NULL;"))
            conn.commit()
            print("[SUCCESS] Added 'currency' column to 'orders'.")
        except Exception as e:
            if "Duplicate column" in str(e) or "already exists" in str(e) or "1060" in str(e):
                print("[INFO] Column 'currency' already exists in 'orders'.")
            else:
                print(f"[WARNING] Warning adding currency to orders: {e}")

        try:
            conn.execute(text("ALTER TABLE orders ADD COLUMN exchange_rate FLOAT DEFAULT 1.0 NOT NULL;"))
            conn.commit()
            print("[SUCCESS] Added 'exchange_rate' column to 'orders'.")
        except Exception as e:
            if "Duplicate column" in str(e) or "already exists" in str(e) or "1060" in str(e):
                print("[INFO] Column 'exchange_rate' already exists in 'orders'.")
            else:
                print(f"[WARNING] Warning adding exchange_rate to orders: {e}")

        try:
            conn.execute(text("ALTER TABLE orders ADD COLUMN tax FLOAT DEFAULT 0.0 NOT NULL;"))
            conn.commit()
            print("[SUCCESS] Added 'tax' column to 'orders'.")
        except Exception as e:
            if "Duplicate column" in str(e) or "already exists" in str(e) or "1060" in str(e):
                print("[INFO] Column 'tax' already exists in 'orders'.")
            else:
                print(f"[WARNING] Warning adding tax to orders: {e}")

        # Check and add currency to payments
        try:
            conn.execute(text("ALTER TABLE payments ADD COLUMN currency VARCHAR(10) DEFAULT 'INR' NOT NULL;"))
            conn.commit()
            print("[SUCCESS] Added 'currency' column to 'payments'.")
        except Exception as e:
            if "Duplicate column" in str(e) or "already exists" in str(e) or "1060" in str(e):
                print("[INFO] Column 'currency' already exists in 'payments'.")
            else:
                print(f"[WARNING] Warning adding currency to payments: {e}")

    # 3. Seed initial exchange rates against 1 INR
    from app.database.session import SessionLocal
    db = SessionLocal()
    try:
        initial_rates = {
            "INR": 1.0,
            "USD": 0.0116,   # ~INR 86.2 per USD
            "EUR": 0.0111,   # ~INR 90.1 per EUR
            "GBP": 0.0094,   # ~INR 106.4 per GBP
            "CAD": 0.0163,   # ~INR 61.3 per CAD
            "AUD": 0.0182,   # ~INR 55.0 per AUD
            "SGD": 0.0157,   # ~INR 63.7 per SGD
            "JPY": 1.78,     # ~INR 0.56 per JPY (1 INR = 1.78 JPY)
        }

        for target_cur, rate_val in initial_rates.items():
            existing = db.query(ExchangeRate).filter(ExchangeRate.target_currency == target_cur).first()
            if not existing:
                er = ExchangeRate(
                    base_currency="INR",
                    target_currency=target_cur,
                    rate=rate_val,
                    is_active=True
                )
                db.add(er)
            else:
                existing.rate = rate_val
                existing.is_active = True

        db.commit()
        print("[SUCCESS] Seeded/Updated initial exchange rates table.")
    finally:
        db.close()

    print("[SUCCESS] Multi-currency database migration complete!")

if __name__ == "__main__":
    run_multicurrency_migration()
