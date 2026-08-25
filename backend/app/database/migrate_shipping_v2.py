import sys
from pathlib import Path
from sqlalchemy import text

# Ensure backend directory in sys.path
backend_dir = Path(__file__).resolve().parent.parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.database.session import engine, Base
from app.models.models import Shipment, ShippingTrackingEvent, ShippingWebhookEvent, ShippingSetting

def migrate():
    print("Running Multi-Region Shipping v2 Schema Migration...")
    Base.metadata.create_all(bind=engine)
    
    with engine.connect() as conn:
        # Check existing columns in shipments table
        result = conn.execute(text("SHOW COLUMNS FROM shipments"))
        existing_cols = [row[0] for row in result.fetchall()]
        print("Existing shipments columns:", existing_cols)
        
        new_cols = [
            ("shipping_service_tier", "VARCHAR(50) DEFAULT 'STANDARD' NOT NULL"),
            ("destination_country", "VARCHAR(100) DEFAULT 'India' NOT NULL"),
            ("shipping_cost", "FLOAT DEFAULT 0.0"),
            ("customs_declared_value", "FLOAT NULL"),
            ("customs_currency", "VARCHAR(10) NULL"),
            ("customs_hs_code", "VARCHAR(50) NULL"),
            ("customs_description", "VARCHAR(255) NULL"),
        ]
        
        for col_name, col_def in new_cols:
            if col_name not in existing_cols:
                try:
                    conn.execute(text(f"ALTER TABLE shipments ADD COLUMN {col_name} {col_def}"))
                    conn.commit()
                    print(f"Added column: {col_name} to shipments table.")
                except Exception as e:
                    print(f"Notice for {col_name}: {e}")
                    
    print("Multi-Region Shipping v2 Schema Migration Completed Successfully!")

if __name__ == "__main__":
    migrate()
