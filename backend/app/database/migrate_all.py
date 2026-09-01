import sys
from pathlib import Path
from sqlalchemy import text

# Ensure backend directory is in sys.path
backend_dir = Path(__file__).resolve().parent.parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.database.session import engine, Base
import app.models.models  # Ensure all model tables are registered with Base.metadata


def run_full_schema_migration():
    """
    Synchronizes MySQL database schema with all SQLAlchemy models by creating missing tables
    and adding any missing columns safely to existing tables.
    """
    print("[MIGRATION] Starting full database schema synchronization...")
    
    # 1. Create any missing tables
    Base.metadata.create_all(bind=engine)
    print("[MIGRATION] Verified all base tables exist.")

    # 2. Add missing columns safely per table
    schema_definitions = {
        "users": [
            ("reset_otp", "VARCHAR(10) NULL"),
            ("reset_otp_expires_at", "DATETIME NULL"),
        ],
        "products": [
            ("weight_kg", "FLOAT DEFAULT 0.35"),
            ("length_cm", "FLOAT DEFAULT 15.0"),
            ("breadth_cm", "FLOAT DEFAULT 10.0"),
            ("height_cm", "FLOAT DEFAULT 8.0"),
            ("base_currency", "VARCHAR(10) DEFAULT 'INR' NOT NULL"),
        ],
        "orders": [
            ("currency", "VARCHAR(10) DEFAULT 'INR' NOT NULL"),
            ("exchange_rate", "FLOAT DEFAULT 1.0 NOT NULL"),
            ("tax", "FLOAT DEFAULT 0.0 NOT NULL"),
            ("shipping_status", "VARCHAR(50) DEFAULT 'NOT_CREATED'"),
            ("shiprocket_order_id", "VARCHAR(100) NULL"),
            ("shiprocket_shipment_id", "VARCHAR(100) NULL"),
            ("awb_code", "VARCHAR(100) NULL"),
            ("courier_name", "VARCHAR(100) NULL"),
            ("courier_id", "INT NULL"),
            ("tracking_url", "VARCHAR(500) NULL"),
            ("shipping_label_url", "VARCHAR(500) NULL"),
            ("shipping_manifest_url", "VARCHAR(500) NULL"),
            ("pickup_scheduled_date", "VARCHAR(100) NULL"),
            ("pickup_token_number", "VARCHAR(100) NULL"),
            ("estimated_delivery_date", "VARCHAR(100) NULL"),
            ("shipping_error_log", "TEXT NULL"),
            ("is_cod", "BOOLEAN DEFAULT 0"),
            ("cod_amount", "FLOAT DEFAULT 0.0"),
            ("priority", "VARCHAR(20) DEFAULT 'NORMAL' NOT NULL"),
            ("assigned_staff", "VARCHAR(100) NULL"),
            ("shipping_method", "VARCHAR(100) DEFAULT 'Standard Express' NOT NULL"),
            ("gst_number", "VARCHAR(50) NULL"),
            ("packing_checklist", "LONGTEXT NULL"),
            ("invoice_number", "VARCHAR(100) NULL"),
            ("risk_level", "VARCHAR(50) DEFAULT 'LOW' NOT NULL"),
            ("fulfillment_status", "VARCHAR(50) DEFAULT 'NEW_ORDER' NOT NULL"),
            ("picked_at", "DATETIME NULL"),
            ("qc_at", "DATETIME NULL"),
            ("packed_at", "DATETIME NULL"),
            ("invoice_generated_at", "DATETIME NULL"),
            ("shipping_label_generated_at", "DATETIME NULL"),
            ("shipped_at", "DATETIME NULL"),
            ("delivered_at", "DATETIME NULL"),
            ("completed_at", "DATETIME NULL"),
            ("cancelled_at", "DATETIME NULL"),
            ("internal_notes", "LONGTEXT NULL"),
            ("gift_wrap", "BOOLEAN DEFAULT 0"),
            ("gift_message", "TEXT NULL"),
            ("free_samples_included", "TEXT NULL"),
            ("updated_at", "DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
        ],
        "addresses": [
            ("address_type", "VARCHAR(50) DEFAULT 'Home'"),
            ("building_or_flat", "VARCHAR(255) NULL"),
            ("landmark", "VARCHAR(255) NULL"),
            ("country", "VARCHAR(100) DEFAULT 'India'"),
            ("is_default", "BOOLEAN DEFAULT 0"),
        ],
        "reviews": [
            ("photo_url", "LONGTEXT NULL"),
            ("is_approved", "BOOLEAN DEFAULT 1"),
        ],
        "payments": [
            ("currency", "VARCHAR(10) DEFAULT 'INR' NOT NULL"),
        ],
        "shipments": [
            ("shipping_service_tier", "VARCHAR(50) DEFAULT 'STANDARD' NOT NULL"),
            ("destination_country", "VARCHAR(100) DEFAULT 'India' NOT NULL"),
            ("shipping_cost", "FLOAT DEFAULT 0.0"),
            ("customs_declared_value", "FLOAT NULL"),
            ("customs_currency", "VARCHAR(10) NULL"),
            ("customs_hs_code", "VARCHAR(50) NULL"),
            ("customs_description", "VARCHAR(255) NULL"),
        ],
        "contact_messages": [
            ("source", "VARCHAR(50) DEFAULT 'CONTACT_FORM'"),
            ("order_number", "VARCHAR(100) NULL"),
            ("phone", "VARCHAR(50) NULL"),
            ("subject", "VARCHAR(255) NULL"),
            ("rating", "VARCHAR(50) NULL"),
            ("status", "VARCHAR(50) DEFAULT 'UNREAD'"),
            ("admin_notes", "TEXT NULL"),
            ("updated_at", "DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
        ],
        "return_requests": [
            ("request_type", "VARCHAR(50) DEFAULT 'EXCHANGE'"),
            ("preferred_exchange_size", "VARCHAR(100) NULL"),
            ("refund_mode", "VARCHAR(50) DEFAULT 'ORIGINAL_PAYMENT'"),
            ("admin_notes", "TEXT NULL"),
            ("photos", "LONGTEXT NULL"),
            ("items_json", "TEXT NULL"),
            ("reverse_awb_code", "VARCHAR(100) NULL"),
            ("reverse_courier_name", "VARCHAR(100) NULL"),
            ("pickup_date", "VARCHAR(100) NULL"),
        ]
    }

    added_columns_count = 0
    with engine.connect() as conn:
        for table_name, columns in schema_definitions.items():
            try:
                res = conn.execute(text(f"SHOW COLUMNS FROM `{table_name}`"))
                existing_cols = {row[0].lower() for row in res.fetchall()}
            except Exception as e:
                print(f"[MIGRATION] Table `{table_name}` check warning: {e}")
                continue

            for col_name, col_type in columns:
                if col_name.lower() not in existing_cols:
                    try:
                        conn.execute(text(f"ALTER TABLE `{table_name}` ADD COLUMN `{col_name}` {col_type}"))
                        conn.commit()
                        print(f"[MIGRATION] Added `{table_name}.{col_name}` ({col_type})")
                        added_columns_count += 1
                    except Exception as e:
                        print(f"[MIGRATION] Could not add `{table_name}.{col_name}`: {e}")

        # Ensure column types for large text and images are LONGTEXT
        large_text_modifications = [
            ("product_images", "image_url", "LONGTEXT NOT NULL"),
            ("categories", "image", "LONGTEXT NULL"),
            ("products", "description", "LONGTEXT NULL"),
            ("products", "ingredients", "LONGTEXT NULL"),
            ("products", "how_to_use", "LONGTEXT NULL"),
        ]
        for tbl, col, col_def in large_text_modifications:
            try:
                conn.execute(text(f"ALTER TABLE `{tbl}` MODIFY COLUMN `{col}` {col_def}"))
                conn.commit()
            except Exception as e:
                print(f"[MIGRATION] Type sync notice for `{tbl}.{col}`: {e}")

        # Ensure full emoji & multilingual UTF-8 support for logs & messages
        for tbl in ["email_logs", "notification_logs", "audit_logs", "contact_messages"]:
            try:
                conn.execute(text(f"ALTER TABLE `{tbl}` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"))
                conn.commit()
            except Exception as e:
                pass

    # 3. Ensure default exchange rates exist
    from app.database.session import SessionLocal
    from app.models.models import ExchangeRate

    db = SessionLocal()
    try:
        initial_rates = {
            "INR": 1.0,
            "USD": 0.0116,
            "EUR": 0.0111,
            "GBP": 0.0094,
            "CAD": 0.0163,
            "AUD": 0.0182,
            "SGD": 0.0157,
            "JPY": 1.78,
        }
        for target_cur, rate_val in initial_rates.items():
            er = db.query(ExchangeRate).filter(ExchangeRate.target_currency == target_cur).first()
            if not er:
                db.add(ExchangeRate(
                    base_currency="INR",
                    target_currency=target_cur,
                    rate=rate_val,
                    is_active=True
                ))
            else:
                er.rate = rate_val
                er.is_active = True
        db.commit()
    except Exception as e:
        print(f"[MIGRATION] Exchange rate sync notice: {e}")
    finally:
        db.close()

    print(f"[MIGRATION] Full database migration completed successfully! ({added_columns_count} columns added/synced).")
    return added_columns_count


if __name__ == "__main__":
    run_full_schema_migration()
