from app.database.session import engine
from sqlalchemy import text

cols = [
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
    ("internal_notes", "TEXT NULL"),
    ("gift_wrap", "TINYINT(1) DEFAULT 0"),
    ("gift_message", "TEXT NULL"),
    ("free_samples_included", "TEXT NULL"),
]

with engine.connect() as conn:
    # Check existing columns in orders table
    result = conn.execute(text("SHOW COLUMNS FROM orders"))
    existing_cols = {row[0] for row in result.fetchall()}

    for name, defn in cols:
        if name not in existing_cols:
            conn.execute(text(f"ALTER TABLE orders ADD COLUMN {name} {defn}"))
            print(f"Added column {name} to orders table.")
        else:
            print(f"Column {name} already exists.")
    conn.commit()

print("Schema migration completed successfully!")
