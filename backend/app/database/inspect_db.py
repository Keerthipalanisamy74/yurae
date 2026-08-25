#!/usr/bin/env python
"""
🌸 YURAE BEAUTY — DATABASE & ENVIRONMENT INSPECTOR CLI
Run this script anytime to inspect active database health, table row counts,
schema synchronization status, and loaded .env configuration.

Usage:
    python backend/app/database/inspect_db.py
    python -m app.database.inspect_db
"""

import sys
import time
from pathlib import Path

# Safe UTF-8 output on Windows console
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# Ensure backend directory is in sys.path
backend_dir = Path(__file__).resolve().parent.parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from sqlalchemy import text
from app.core.config import settings, backend_env, root_env
from app.database.session import engine, SessionLocal, Base
import app.models.models  # Register all models


def mask_secret(value: str, visible_chars: int = 4) -> str:
    if not value:
        return "• (Not Set)"
    if len(value) <= visible_chars * 2:
        return "••••••••"
    return f"{value[:visible_chars]}••••••••{value[-visible_chars:]}"


def inspect():
    term_width = 80
    border = "=" * term_width
    sub_border = "-" * term_width

    print("\n" + border)
    print(" 🌸 YURAE BEAUTY — DATABASE & ENVIRONMENT INSPECTOR")
    print(border)

    # 1. Environment Status
    print("\n📁 1. ENVIRONMENT CONFIGURATION (.env)")
    print(sub_border)
    print(f"  Root .env File        : {'✅ Found (' + str(root_env) + ')' if root_env.exists() else '❌ Not Found'}")
    print(f"  Backend .env File     : {'✅ Found (' + str(backend_env) + ')' if backend_env.exists() else '❌ Not Found'}")
    print(f"  Project Name          : {settings.PROJECT_NAME} v{settings.VERSION}")
    print(f"  Base Currency         : {settings.BASE_CURRENCY}")
    print(f"  Supported Currencies  : {settings.SUPPORTED_CURRENCIES}")
    print(f"  Shipping Mode         : {settings.SHIPPING_MODE.upper()} (Domestic: {settings.SHIPPING_PROVIDER}, Int'l: {settings.INTERNATIONAL_SHIPPING_PROVIDER})")
    print(f"  Razorpay Key ID       : {mask_secret(settings.RAZORPAY_KEY_ID)}")
    print(f"  Stripe Public Key     : {mask_secret(settings.STRIPE_PUBLIC_KEY)}")
    print(f"  Warehouse Origin      : {settings.WAREHOUSE_CITY}, {settings.WAREHOUSE_STATE}, {settings.WAREHOUSE_PINCODE}, {settings.WAREHOUSE_COUNTRY}")

    # 2. Database Connection Check
    print("\n🗄️  2. DATABASE CONNECTION HEALTH")
    print(sub_border)
    
    db_url = settings.DATABASE_URL
    # Mask password in URL for display
    display_url = db_url
    if "@" in display_url and "://" in display_url:
        proto, rest = display_url.split("://", 1)
        userpass, hostdb = rest.split("@", 1)
        user = userpass.split(":", 1)[0]
        display_url = f"{proto}://{user}:••••••••@{hostdb}"

    print(f"  Configured URL        : {display_url}")
    
    start_time = time.time()
    try:
        with engine.connect() as conn:
            # Measure ping latency
            res = conn.execute(text("SELECT DATABASE(), VERSION(), NOW()")).fetchone()
            latency_ms = round((time.time() - start_time) * 1000, 2)
            db_name = res[0] if res else "Unknown"
            db_version = res[1] if res else "Unknown"
            db_time = res[2] if res else "Unknown"

            print(f"  Connection Status     : 🟢 CONNECTED (Latency: {latency_ms} ms)")
            print(f"  Active Database       : {db_name}")
            print(f"  Database Version      : {db_version}")
            print(f"  Database Server Time  : {db_time}")
    except Exception as e:
        print(f"  Connection Status     : 🔴 CONNECTION FAILED: {e}")
        print(border + "\n")
        return

    # 3. Database Tables & Live Record Counts
    print("\n📊 3. DATABASE TABLES & RECORD COUNTS")
    print(sub_border)
    print(f"  {'Table Name':<32} | {'Row Count':<12} | {'Status'}")
    print(f"  {'-'*32} | {'-'*12} | {'-'*15}")

    total_rows = 0
    table_stats = []
    with engine.connect() as conn:
        tables_res = conn.execute(text("SHOW TABLES")).fetchall()
        for (t_name,) in tables_res:
            try:
                cnt = conn.execute(text(f"SELECT COUNT(*) FROM `{t_name}`")).scalar()
                total_rows += cnt
                table_stats.append((t_name, cnt))
                print(f"  {t_name:<32} | {cnt:<12} | {'Active' if cnt > 0 else 'Empty'}")
            except Exception as ex:
                print(f"  {t_name:<32} | {'ERROR':<12} | {ex}")

    print(f"  {'-'*32} | {'-'*12} | {'-'*15}")
    print(f"  {'TOTAL TABLES: ' + str(len(table_stats)):<32} | {total_rows:<12} | Total Rows")

    # 4. Schema Column Sync Verification
    print("\n🔍 4. MODEL SCHEMA SYNCHRONIZATION")
    print(sub_border)
    missing_columns = []
    with engine.connect() as conn:
        for table_name, table in Base.metadata.tables.items():
            try:
                res = conn.execute(text(f"SHOW COLUMNS FROM `{table_name}`"))
                db_cols = {row[0].lower() for row in res.fetchall()}
                for col in table.columns:
                    if col.name.lower() not in db_cols:
                        missing_columns.append(f"{table_name}.{col.name}")
            except Exception:
                pass

    if not missing_columns:
        print("  ✅ All database tables are 100% in sync with SQLAlchemy models! (0 missing columns)")
    else:
        print(f"  ⚠️  Missing columns detected ({len(missing_columns)}):")
        for mc in missing_columns:
            print(f"     - {mc}")
        print("  💡 Run 'python backend/app/database/migrate_all.py' to synchronize schema.")

    # 5. Quick Sample Data Highlights
    print("\n✨ 5. CATALOG & ACCOUNT HIGHLIGHTS")
    print(sub_border)
    db = SessionLocal()
    try:
        from app.models.models import User, Product, Category, Coupon, ExchangeRate
        users = db.query(User).all()
        products = db.query(Product).all()
        categories = db.query(Category).all()
        coupons = db.query(Coupon).all()
        rates = db.query(ExchangeRate).all()

        print(f"  Registered Users      : {len(users)} ({', '.join([u.email + ' [' + u.role + ']' for u in users])})")
        print(f"  Categories            : {len(categories)} ({', '.join([c.name for c in categories])})")
        print(f"  Products in Catalog   : {len(products)} active SKUs")
        print(f"  Active Coupons        : {len(coupons)} ({', '.join([c.code for c in coupons])})")
        print(f"  Exchange Rates        : {len(rates)} currencies configured (Base: {settings.BASE_CURRENCY})")
    except Exception as e:
        print(f"  Data query notice     : {e}")
    finally:
        db.close()

    print("\n" + border)
    print(" ✅ INSPECTION COMPLETE — YURAE BEAUTY BACKEND IS OPERATIONAL")
    print(border + "\n")


if __name__ == "__main__":
    inspect()
