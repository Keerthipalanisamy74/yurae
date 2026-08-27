import time
import csv
import io
from datetime import datetime, date
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse, JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from app.database.session import get_db, engine, Base
from app.models.models import (
    Order, User, Product, Category, Coupon, Review, ExchangeRate, Shipment,
    AuditLog, ContactMessage, ReturnRequest, StockNotification, QualityCheckLog,
    PackingLog, Warehouse, ProductInventoryLocation, Address, Wishlist, CartItem, ProductVariant
)
from app.schemas.schemas import AdminDashboardStats, OrderResponse, UserResponse
from app.api.deps import get_current_admin
from app.core.config import settings, backend_env, root_env
from app.database.migrate_all import run_full_schema_migration
from app.database.seed import seed_db
from pydantic import BaseModel

router = APIRouter(prefix="/admin", tags=["Admin Dashboard"])

@router.get("/dashboard", response_model=AdminDashboardStats)
def get_dashboard_stats(current_admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    total_sales_result = db.query(func.sum(Order.total_amount)).filter(Order.payment_status == "Paid").scalar()
    total_sales = float(total_sales_result) if total_sales_result else 0.0

    total_orders = db.query(Order).count()
    total_customers = db.query(User).filter(User.role == "CUSTOMER").count()
    total_products = db.query(Product).count()
    pending_orders = db.query(Order).filter(Order.order_status.in_(["Pending", "Processing", "Confirmed"])).count()
    low_stock_products = db.query(Product).filter(Product.stock_quantity <= 10).count()

    recent_orders = db.query(Order).order_by(Order.created_at.desc()).limit(10).all()

    return AdminDashboardStats(
        total_sales=round(total_sales, 2),
        total_orders=total_orders,
        total_customers=total_customers,
        total_products=total_products,
        pending_orders=pending_orders,
        low_stock_products=low_stock_products,
        recent_orders=recent_orders
    )

@router.get("/orders", response_model=List[OrderResponse])
def get_all_orders_admin(
    status: Optional[str] = None,
    search: Optional[str] = None,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    query = db.query(Order)
    if status:
        query = query.filter(Order.order_status == status)
    if search:
        query = query.filter(Order.order_number.ilike(f"%{search}%"))
    return query.order_by(Order.created_at.desc()).all()

@router.get("/customers", response_model=List[UserResponse])
def get_all_customers(
    search: Optional[str] = None,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    query = db.query(User).filter(User.role == "CUSTOMER")
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            (User.first_name.ilike(search_fmt)) |
            (User.last_name.ilike(search_fmt)) |
            (User.email.ilike(search_fmt))
        )
    return query.order_by(User.created_at.desc()).all()

@router.put("/customers/{user_id}/toggle-status")
def toggle_customer_status(
    user_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id, User.role == "CUSTOMER").first()
    if not user:
        raise HTTPException(status_code=404, detail="Customer not found")
    user.is_active = not user.is_active
    db.commit()
    return {"message": "Customer active status updated", "is_active": user.is_active}

@router.get("/inventory")
def get_inventory(
    low_stock_threshold: int = 15,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    products = db.query(Product).order_by(Product.stock_quantity.asc()).all()
    inventory_data = []
    for p in products:
        inventory_data.append({
            "id": p.id,
            "name": p.name,
            "sku": p.sku,
            "category": p.category.name if p.category else "Uncategorized",
            "stock_quantity": p.stock_quantity,
            "status": p.status,
            "is_low_stock": p.stock_quantity <= low_stock_threshold,
            "is_out_of_stock": p.stock_quantity == 0
        })
    return inventory_data


# ==============================================================================
# 🗄️ DATABASE & SYSTEM ENVIRONMENT EXPLORER ENDPOINTS
# ==============================================================================

def _mask_secret(val: str, visible: int = 4) -> str:
    if not val:
        return "Not Set"
    if len(val) <= visible * 2:
        return "••••••••"
    return f"{val[:visible]}••••••••{val[-visible:]}"


@router.get("/database-overview")
def get_database_overview(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Returns live database connection health, engine info, table names with row counts,
    and schema column details.
    """
    start_time = time.time()
    db_url = settings.DATABASE_URL
    masked_url = db_url
    if "@" in masked_url and "://" in masked_url:
        proto, rest = masked_url.split("://", 1)
        userpass, hostdb = rest.split("@", 1)
        user = userpass.split(":", 1)[0]
        masked_url = f"{proto}://{user}:••••••••@{hostdb}"

    is_sqlite = "sqlite" in db_url.lower()
    engine_name = "SQLite" if is_sqlite else "MySQL / MariaDB"

    try:
        with engine.connect() as conn:
            if not is_sqlite:
                res = conn.execute(text("SELECT DATABASE(), VERSION(), NOW()")).fetchone()
                latency_ms = round((time.time() - start_time) * 1000, 2)
                db_name = res[0] if res else "Unknown"
                db_version = res[1] if res else "Unknown"
                db_time = str(res[2]) if res else ""
                tables_res = conn.execute(text("SHOW TABLES")).fetchall()
                table_names = [t[0] for t in tables_res]
            else:
                latency_ms = round((time.time() - start_time) * 1000, 2)
                db_name = "SQLite Local File"
                db_version = "3.x"
                db_time = ""
                tables_res = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table'")).fetchall()
                table_names = [t[0] for t in tables_res]

            tables_info = []
            total_rows = 0

            for t_name in table_names:
                try:
                    count = conn.execute(text(f"SELECT COUNT(*) FROM `{t_name}`")).scalar() or 0
                except Exception:
                    count = 0
                total_rows += count

                # Get column schema
                cols = []
                try:
                    if not is_sqlite:
                        col_res = conn.execute(text(f"DESCRIBE `{t_name}`")).fetchall()
                        for c in col_res:
                            cols.append({
                                "name": c[0],
                                "type": str(c[1]),
                                "nullable": c[2] == "YES",
                                "is_primary_key": c[3] == "PRI",
                                "default": str(c[4]) if c[4] is not None else None
                            })
                    else:
                        col_res = conn.execute(text(f"PRAGMA table_info(`{t_name}`)"))
                        for c in col_res:
                            cols.append({
                                "name": c[1],
                                "type": str(c[2]),
                                "nullable": c[3] == 0,
                                "is_primary_key": c[5] == 1,
                                "default": str(c[4]) if c[4] is not None else None
                            })
                except Exception:
                    pass

                tables_info.append({
                    "name": t_name,
                    "row_count": count,
                    "column_count": len(cols),
                    "columns": cols
                })

            # Check missing columns against SQLAlchemy Base.metadata
            missing_cols = []
            for t_name, table in Base.metadata.tables.items():
                try:
                    if not is_sqlite:
                        res = conn.execute(text(f"SHOW COLUMNS FROM `{t_name}`"))
                        existing = {row[0].lower() for row in res.fetchall()}
                        for col in table.columns:
                            if col.name.lower() not in existing:
                                missing_cols.append(f"{t_name}.{col.name}")
                except Exception:
                    pass

            return {
                "status": "CONNECTED",
                "engine": engine_name,
                "database_name": db_name,
                "database_version": db_version,
                "database_url_masked": masked_url,
                "latency_ms": latency_ms,
                "server_time": db_time,
                "total_tables": len(tables_info),
                "total_rows": total_rows,
                "tables": sorted(tables_info, key=lambda x: x["name"]),
                "schema_in_sync": len(missing_cols) == 0,
                "missing_columns": missing_cols
            }
    except Exception as e:
        return {
            "status": "DISCONNECTED",
            "engine": engine_name,
            "database_url_masked": masked_url,
            "error": str(e),
            "total_tables": 0,
            "total_rows": 0,
            "tables": [],
            "schema_in_sync": False,
            "missing_columns": []
        }


@router.post("/database-sync")
def trigger_database_sync(current_admin: User = Depends(get_current_admin)):
    """
    Executes database schema migration and synchronizes missing columns across tables.
    """
    try:
        added_count = run_full_schema_migration()
        return {
            "success": True,
            "message": f"Database schema successfully synchronized! ({added_count} columns updated)",
            "added_columns_count": added_count
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Schema migration failed: {str(e)}"
        )


@router.post("/database-seed")
def trigger_database_seed(current_admin: User = Depends(get_current_admin)):
    """
    Safely seeds/repopulates demo luxury skincare products, categories, coupons, and sample reviews.
    """
    try:
        seed_db()
        return {
            "success": True,
            "message": "Database catalog successfully seeded with luxury skincare & atelier products!"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database seeding failed: {str(e)}"
        )


@router.get("/env-overview")
def get_env_overview(current_admin: User = Depends(get_current_admin)):
    """
    Provides safe, masked overview of active environment configuration.
    """
    return {
        "core": {
            "project_name": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "api_v1_prefix": settings.API_V1_STR,
            "access_token_expire_days": round(settings.ACCESS_TOKEN_EXPIRE_MINUTES / (60 * 24), 1),
            "jwt_secret_configured": bool(settings.SECRET_KEY),
            "root_env_exists": root_env.exists(),
            "backend_env_exists": backend_env.exists()
        },
        "database": {
            "dialect": "sqlite" if "sqlite" in settings.DATABASE_URL.lower() else "mysql",
            "url_masked": (
                settings.DATABASE_URL.split("@")[1]
                if "@" in settings.DATABASE_URL
                else "sqlite://..."
            ),
            "pool_pre_ping": True,
            "pool_recycle_sec": 3600
        },
        "currency": {
            "base_currency": settings.BASE_CURRENCY,
            "supported_currencies": settings.SUPPORTED_CURRENCIES.split(","),
            "exchange_rate_api": settings.EXCHANGE_RATE_API_URL,
            "api_key_set": bool(settings.EXCHANGE_RATE_API_KEY)
        },
        "payments": {
            "razorpay": {
                "enabled": bool(settings.RAZORPAY_KEY_ID),
                "key_id_masked": _mask_secret(settings.RAZORPAY_KEY_ID),
                "secret_set": bool(settings.RAZORPAY_KEY_SECRET)
            },
            "stripe": {
                "enabled": bool(settings.STRIPE_PUBLIC_KEY),
                "public_key_masked": _mask_secret(settings.STRIPE_PUBLIC_KEY),
                "secret_set": bool(settings.STRIPE_SECRET_KEY)
            },
            "paypal": {
                "enabled": bool(settings.PAYPAL_CLIENT_ID),
                "client_id_masked": _mask_secret(settings.PAYPAL_CLIENT_ID),
                "secret_set": bool(settings.PAYPAL_CLIENT_SECRET)
            }
        },
        "shipping": {
            "mode": settings.SHIPPING_MODE.upper(),
            "domestic_provider": settings.SHIPPING_PROVIDER,
            "international_provider": settings.INTERNATIONAL_SHIPPING_PROVIDER,
            "cod_enabled": settings.COD_ENABLED,
            "flat_shipping_fee_inr": settings.DEFAULT_FLAT_SHIPPING_FEE,
            "free_shipping_threshold_inr": settings.DEFAULT_FREE_SHIPPING_THRESHOLD,
            "international_flat_usd": settings.DEFAULT_INTERNATIONAL_FLAT_FEE_USD,
            "warehouse": {
                "name": settings.WAREHOUSE_CONTACT_NAME,
                "city": settings.WAREHOUSE_CITY,
                "state": settings.WAREHOUSE_STATE,
                "pincode": settings.WAREHOUSE_PINCODE,
                "country": settings.WAREHOUSE_COUNTRY
            }
        }
    }


# ==============================================================================
# 📊 GST, SALES & ACCOUNTING REPORT EXPORTS
# ==============================================================================

@router.get("/reports/gst-summary")
def get_gst_accounting_summary(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    query = db.query(Order)
    if start_date:
        try:
            sd = datetime.strptime(start_date, "%Y-%m-%d")
            query = query.filter(Order.created_at >= sd)
        except Exception:
            pass
    if end_date:
        try:
            ed = datetime.strptime(end_date + " 23:59:59", "%Y-%m-%d %H:%M:%S")
            query = query.filter(Order.created_at <= ed)
        except Exception:
            pass

    orders = query.all()
    paid_orders = [o for o in orders if o.payment_status == "Paid"]

    total_gross_sales = sum(o.total_amount for o in paid_orders)
    total_shipping_charges = sum(o.shipping_fee or 0.0 for o in paid_orders)
    total_discounts = sum(o.discount or 0.0 for o in paid_orders)

    total_taxable_turnover = 0.0
    total_cgst = 0.0
    total_sgst = 0.0
    total_igst = 0.0

    warehouse_state = (settings.WAREHOUSE_STATE or "Tamil Nadu").strip().lower()

    for o in paid_orders:
        net_taxable_base = max(0.0, (o.subtotal - (o.discount or 0.0))) / 1.18
        tax_amount = max(0.0, (o.subtotal - (o.discount or 0.0))) - net_taxable_base
        total_taxable_turnover += net_taxable_base

        state = (o.address.state if o.address and o.address.state else "Tamil Nadu").strip().lower()
        country = (o.address.country if o.address and o.address.country else "India").strip().lower()

        if country in ["india", "in"] and (state == warehouse_state or "tamil" in state or "tn" == state):
            total_cgst += tax_amount / 2.0
            total_sgst += tax_amount / 2.0
        else:
            total_igst += tax_amount

    # Total inventory valuation
    products = db.query(Product).all()
    total_inventory_units = sum(p.stock_quantity or 0 for p in products)
    total_valuation_mrp = sum((p.stock_quantity or 0) * (p.price or 0.0) for p in products)
    total_valuation_sale = sum((p.stock_quantity or 0) * (p.sale_price or p.price or 0.0) for p in products)

    return {
        "period": {
            "start_date": start_date or "All Time",
            "end_date": end_date or "Present",
        },
        "sales": {
            "total_orders_count": len(orders),
            "paid_orders_count": len(paid_orders),
            "pending_orders_count": len([o for o in orders if o.payment_status != "Paid"]),
            "gross_sales_inr": round(total_gross_sales, 2),
            "taxable_turnover_inr": round(total_taxable_turnover, 2),
            "total_tax_collected_inr": round(total_cgst + total_sgst + total_igst, 2),
            "cgst_inr": round(total_cgst, 2),
            "sgst_inr": round(total_sgst, 2),
            "igst_inr": round(total_igst, 2),
            "shipping_charges_inr": round(total_shipping_charges, 2),
            "total_discounts_inr": round(total_discounts, 2),
        },
        "inventory": {
            "total_products_count": len(products),
            "total_stock_units": total_inventory_units,
            "valuation_mrp_inr": round(total_valuation_mrp, 2),
            "valuation_sale_price_inr": round(total_valuation_sale, 2),
            "low_stock_count": len([p for p in products if (p.stock_quantity or 0) <= 10]),
            "out_of_stock_count": len([p for p in products if (p.stock_quantity or 0) == 0]),
        }
    }


@router.get("/reports/sales-gst")
def export_sales_gst_report(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    payment_status: Optional[str] = "Paid",
    format: str = "csv",
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    query = db.query(Order)
    if start_date:
        try:
            sd = datetime.strptime(start_date, "%Y-%m-%d")
            query = query.filter(Order.created_at >= sd)
        except Exception:
            pass
    if end_date:
        try:
            ed = datetime.strptime(end_date + " 23:59:59", "%Y-%m-%d %H:%M:%S")
            query = query.filter(Order.created_at <= ed)
        except Exception:
            pass
    if payment_status and payment_status.upper() != "ALL":
        query = query.filter(Order.payment_status == payment_status)

    orders = query.order_by(Order.created_at.desc()).all()
    warehouse_state = (settings.WAREHOUSE_STATE or "Tamil Nadu").strip().lower()

    rows = []
    for ord in orders:
        cust_name = f"{ord.user.first_name} {ord.user.last_name}" if ord.user else "Guest Customer"
        cust_email = ord.user.email if ord.user else ""
        cust_phone = ord.address.phone if ord.address and ord.address.phone else ""
        state = ord.address.state if ord.address and ord.address.state else "Tamil Nadu"
        country = ord.address.country if ord.address and ord.address.country else "India"
        is_intra = country.lower() in ["india", "in"] and (state.strip().lower() == warehouse_state or "tamil" in state.lower() or "tn" == state.lower().strip())
        is_export = country.lower() not in ["india", "in"]

        supply_type = "Export (Zero Rated)" if is_export else ("Intra-State (CGST + SGST)" if is_intra else "Inter-State (IGST)")

        items_summary = "; ".join([f"{item.product_name} (x{item.quantity})" for item in ord.items]) if ord.items else "Products"
        total_items_qty = sum(item.quantity for item in ord.items) if ord.items else 1

        hsn_code = "330499"

        net_taxable_base = max(0.0, (ord.subtotal - (ord.discount or 0.0))) / 1.18
        tax_amount = max(0.0, (ord.subtotal - (ord.discount or 0.0))) - net_taxable_base

        if is_intra:
            cgst = tax_amount / 2.0
            sgst = tax_amount / 2.0
            igst = 0.0
            gst_rate_str = "18% (9% CGST + 9% SGST)"
        elif is_export:
            cgst = 0.0
            sgst = 0.0
            igst = 0.0
            gst_rate_str = "0% (Export LUT)"
        else:
            cgst = 0.0
            sgst = 0.0
            igst = tax_amount
            gst_rate_str = "18% (IGST)"

        payment_method = ord.payments[0].payment_method if ord.payments else ("COD" if ord.is_cod else "Online")
        txn_id = ord.payments[0].payment_id if ord.payments else (ord.shiprocket_order_id or "")

        row = {
            "Invoice_Number": ord.order_number,
            "Invoice_Date": ord.created_at.strftime("%Y-%m-%d %H:%M") if ord.created_at else "",
            "Customer_Name": cust_name,
            "Customer_Email": cust_email,
            "Customer_Phone": cust_phone,
            "Place_of_Supply_State": state,
            "Country": country,
            "Supply_Type": supply_type,
            "HSN_SAC_Code": hsn_code,
            "Items_Description": items_summary,
            "Total_Quantity": total_items_qty,
            "Currency": ord.currency or "INR",
            "Exchange_Rate": ord.exchange_rate or 1.0,
            "Gross_Item_Total_INR": round(ord.subtotal, 2),
            "Discount_INR": round(ord.discount or 0.0, 2),
            "Taxable_Value_INR": round(net_taxable_base, 2),
            "GST_Rate": gst_rate_str,
            "CGST_9pct_INR": round(cgst, 2),
            "SGST_9pct_INR": round(sgst, 2),
            "IGST_18pct_INR": round(igst, 2),
            "Total_Tax_INR": round(cgst + sgst + igst, 2),
            "Shipping_Fee_INR": round(ord.shipping_fee or 0.0, 2),
            "Total_Invoice_Amount_INR": round(ord.total_amount, 2),
            "Payment_Mode": payment_method,
            "Payment_Status": ord.payment_status,
            "Transaction_ID": txn_id,
            "Order_Status": ord.order_status,
            "Courier_AWB": ord.awb_code or "",
        }
        rows.append(row)

    if format == "json":
        return rows

    output = io.StringIO()
    if rows:
        headers = list(rows[0].keys())
        writer = csv.DictWriter(output, fieldnames=headers)
        writer.writeheader()
        writer.writerows(rows)
    else:
        writer = csv.writer(output)
        writer.writerow(["No orders found matching the filter criteria."])

    csv_content = output.getvalue()
    filename = f"yurae_gst_sales_report_{datetime.utcnow().strftime('%Y%m%d_%H%M')}.csv"
    return StreamingResponse(
        io.BytesIO(csv_content.encode("utf-8-sig")),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/reports/orders")
def export_orders_master_report(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    status: Optional[str] = None,
    payment_status: Optional[str] = None,
    format: str = "csv",
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    query = db.query(Order)
    if start_date:
        try:
            sd = datetime.strptime(start_date, "%Y-%m-%d")
            query = query.filter(Order.created_at >= sd)
        except Exception:
            pass
    if end_date:
        try:
            ed = datetime.strptime(end_date + " 23:59:59", "%Y-%m-%d %H:%M:%S")
            query = query.filter(Order.created_at <= ed)
        except Exception:
            pass
    if status and status.lower() != "all":
        query = query.filter(Order.order_status == status)
    if payment_status and payment_status.lower() != "all":
        query = query.filter(Order.payment_status == payment_status)

    orders = query.order_by(Order.created_at.desc()).all()

    rows = []
    for ord in orders:
        cust_name = f"{ord.user.first_name} {ord.user.last_name}" if ord.user else "Guest Customer"
        cust_email = ord.user.email if ord.user else ""
        cust_phone = ord.address.phone if ord.address and ord.address.phone else ""
        addr_line = f"{ord.address.street or ''}, {ord.address.city or ''}, {ord.address.state or ''} - {ord.address.postal_code or ''}, {ord.address.country or ''}" if ord.address else ""

        items_details = "; ".join([f"{item.product_name} [{item.variant_info or 'Standard'}] (Qty: {item.quantity}, Price: {item.price})" for item in ord.items]) if ord.items else ""
        total_items_qty = sum(item.quantity for item in ord.items) if ord.items else 1

        payment_method = ord.payments[0].payment_method if ord.payments else ("COD" if ord.is_cod else "Online")
        txn_id = ord.payments[0].payment_id if ord.payments else (ord.shiprocket_order_id or "")

        row = {
            "Order_ID": ord.id,
            "Order_Number": ord.order_number,
            "Order_Date": ord.created_at.strftime("%Y-%m-%d %H:%M:%S") if ord.created_at else "",
            "Customer_Name": cust_name,
            "Customer_Email": cust_email,
            "Customer_Phone": cust_phone,
            "Shipping_Address": addr_line,
            "City": ord.address.city if ord.address else "",
            "State": ord.address.state if ord.address else "",
            "Postal_Code": ord.address.postal_code if ord.address else "",
            "Country": ord.address.country if ord.address else "India",
            "Items_Summary": items_details,
            "Total_Items_Count": total_items_qty,
            "Currency": ord.currency or "INR",
            "Exchange_Rate": ord.exchange_rate or 1.0,
            "Subtotal": round(ord.subtotal, 2),
            "Discount": round(ord.discount or 0.0, 2),
            "Shipping_Fee": round(ord.shipping_fee or 0.0, 2),
            "Tax_Amount": round(ord.tax or 0.0, 2),
            "Total_Order_Amount": round(ord.total_amount, 2),
            "Payment_Status": ord.payment_status,
            "Payment_Method": payment_method,
            "Transaction_ID": txn_id,
            "Order_Status": ord.order_status,
            "Courier_Name": ord.courier_name or "",
            "AWB_Code": ord.awb_code or "",
            "Shipping_Status": ord.shipping_status or "NOT_CREATED",
            "Estimated_Delivery": ord.estimated_delivery_date or "",
        }
        rows.append(row)

    if format == "json":
        return rows

    output = io.StringIO()
    if rows:
        headers = list(rows[0].keys())
        writer = csv.DictWriter(output, fieldnames=headers)
        writer.writeheader()
        writer.writerows(rows)
    else:
        writer = csv.writer(output)
        writer.writerow(["No orders found matching the filter criteria."])

    csv_content = output.getvalue()
    filename = f"yurae_orders_ledger_{datetime.utcnow().strftime('%Y%m%d_%H%M')}.csv"
    return StreamingResponse(
        io.BytesIO(csv_content.encode("utf-8-sig")),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/reports/inventory")
def export_inventory_valuation_report(
    category_id: Optional[int] = None,
    stock_status: Optional[str] = None,
    format: str = "csv",
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    query = db.query(Product)
    if category_id:
        query = query.filter(Product.category_id == category_id)

    products = query.order_by(Product.stock_quantity.asc()).all()

    rows = []
    for p in products:
        qty = p.stock_quantity or 0
        if stock_status == "OUT" and qty > 0:
            continue
        if stock_status == "LOW" and (qty > 10 or qty == 0):
            continue
        if stock_status == "IN" and qty == 0:
            continue

        health_status = "OUT OF STOCK" if qty == 0 else ("LOW STOCK ALERT" if qty <= 10 else "IN STOCK")
        mrp = p.price or 0.0
        sale_p = p.sale_price or mrp
        discount_pct = round(((mrp - sale_p) / mrp) * 100, 1) if mrp > sale_p and mrp > 0 else 0.0

        val_mrp = qty * mrp
        val_sale = qty * sale_p

        variants_str = ", ".join([f"{v.variant_name}: {v.variant_value} (Stock: {v.stock_quantity}, +₹{v.additional_price})" for v in p.variants]) if p.variants else "Standard"

        row = {
            "Product_ID": p.id,
            "SKU": p.sku,
            "Product_Name": p.name,
            "Category": p.category.name if p.category else "Uncategorized",
            "Brand": p.brand or "Yurae",
            "Stock_Quantity_Units": qty,
            "Stock_Health_Status": health_status,
            "Base_MRP_Price_INR": round(mrp, 2),
            "Sale_Price_INR": round(sale_p, 2),
            "Discount_Percentage": f"{discount_pct}%",
            "Inventory_Valuation_MRP_INR": round(val_mrp, 2),
            "Inventory_Valuation_Sale_Price_INR": round(val_sale, 2),
            "Weight_KG": p.weight_kg if p.weight_kg is not None else 0.35,
            "Dimensions_L_B_H_CM": f"{p.length_cm or 15} x {p.breadth_cm or 10} x {p.height_cm or 8}",
            "Active_Variants": variants_str,
            "Product_Status": p.status or "ACTIVE",
            "Created_At": p.created_at.strftime("%Y-%m-%d") if p.created_at else "",
            "Last_Updated": p.updated_at.strftime("%Y-%m-%d") if p.updated_at else "",
        }
        rows.append(row)

    if format == "json":
        return rows

    output = io.StringIO()
    if rows:
        headers = list(rows[0].keys())
        writer = csv.DictWriter(output, fieldnames=headers)
        writer.writeheader()
        writer.writerows(rows)
    else:
        writer = csv.writer(output)
        writer.writerow(["No products found matching the criteria."])

    csv_content = output.getvalue()
    filename = f"yurae_inventory_valuation_{datetime.utcnow().strftime('%Y%m%d_%H%M')}.csv"
    return StreamingResponse(
        io.BytesIO(csv_content.encode("utf-8-sig")),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/reports/gstr1-summary")
def export_gstr1_summary_report(
    year: Optional[int] = None,
    month: Optional[int] = None,
    format: str = "csv",
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    query = db.query(Order).filter(Order.payment_status == "Paid")
    if year:
        query = query.filter(func.extract('year', Order.created_at) == year)
    if month:
        query = query.filter(func.extract('month', Order.created_at) == month)

    orders = query.all()
    warehouse_state = (settings.WAREHOUSE_STATE or "Tamil Nadu").strip().lower()

    state_groups: Dict[str, Dict[str, Any]] = {}

    for ord in orders:
        state = ord.address.state if ord.address and ord.address.state else "Tamil Nadu"
        country = ord.address.country if ord.address and ord.address.country else "India"
        is_intra = country.lower() in ["india", "in"] and (state.strip().lower() == warehouse_state or "tamil" in state.lower() or "tn" == state.lower().strip())
        is_export = country.lower() not in ["india", "in"]

        group_key = f"{state}_{'EXPORT' if is_export else ('INTRA' if is_intra else 'INTER')}"

        if group_key not in state_groups:
            state_groups[group_key] = {
                "Place_of_Supply": state if not is_export else f"{country} (Export)",
                "Transaction_Type": "Export (Zero Rated)" if is_export else ("B2C Intra-State E-Commerce" if is_intra else "B2C Inter-State E-Commerce"),
                "Rate_pct": 0 if is_export else 18,
                "Invoices_Count": 0,
                "Taxable_Turnover_INR": 0.0,
                "CGST_INR": 0.0,
                "SGST_INR": 0.0,
                "IGST_INR": 0.0,
                "Total_Tax_INR": 0.0,
                "Gross_Invoice_Value_INR": 0.0
            }

        net_taxable_base = max(0.0, (ord.subtotal - (ord.discount or 0.0))) / 1.18
        tax_amount = max(0.0, (ord.subtotal - (ord.discount or 0.0))) - net_taxable_base

        state_groups[group_key]["Invoices_Count"] += 1
        state_groups[group_key]["Taxable_Turnover_INR"] += net_taxable_base
        state_groups[group_key]["Gross_Invoice_Value_INR"] += ord.total_amount

        if is_intra:
            state_groups[group_key]["CGST_INR"] += tax_amount / 2.0
            state_groups[group_key]["SGST_INR"] += tax_amount / 2.0
            state_groups[group_key]["Total_Tax_INR"] += tax_amount
        elif is_export:
            pass
        else:
            state_groups[group_key]["IGST_INR"] += tax_amount
            state_groups[group_key]["Total_Tax_INR"] += tax_amount

    rows = []
    for g in state_groups.values():
        rows.append({
            "Period": f"{year or 'All'}-{str(month or 'All').zfill(2) if month else 'All'}",
            "Place_of_Supply": g["Place_of_Supply"],
            "Transaction_Type": g["Transaction_Type"],
            "Applicable_Rate": f"{g['Rate_pct']}%",
            "Invoices_Count": g["Invoices_Count"],
            "Total_Taxable_Turnover_INR": round(g["Taxable_Turnover_INR"], 2),
            "CGST_9pct_INR": round(g["CGST_INR"], 2),
            "SGST_9pct_INR": round(g["SGST_INR"], 2),
            "IGST_18pct_INR": round(g["IGST_INR"], 2),
            "Total_Tax_Collected_INR": round(g["Total_Tax_INR"], 2),
            "Gross_Invoice_Value_INR": round(g["Gross_Invoice_Value_INR"], 2),
        })

    if format == "json":
        return rows

    output = io.StringIO()
    if rows:
        headers = list(rows[0].keys())
        writer = csv.DictWriter(output, fieldnames=headers)
        writer.writeheader()
        writer.writerows(rows)
    else:
        writer = csv.writer(output)
        writer.writerow(["No GSTR-1 records found for the period."])

    csv_content = output.getvalue()
    filename = f"yurae_gstr1_summary_{datetime.utcnow().strftime('%Y%m%d_%H%M')}.csv"
    return StreamingResponse(
        io.BytesIO(csv_content.encode("utf-8-sig")),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# ==============================================================================
# 🌟 ENTERPRISE REVIEWS MODERATION & MANAGEMENT
# ==============================================================================

class ReviewStatusUpdate(BaseModel):
    is_approved: Optional[bool] = None
    featured: Optional[bool] = None
    admin_reply: Optional[str] = None

@router.get("/reviews")
def get_all_reviews_admin(
    status: Optional[str] = "ALL",
    rating: Optional[int] = None,
    search: Optional[str] = None,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    query = db.query(Review)
    if status == "APPROVED":
        query = query.filter(Review.is_approved == True)
    elif status == "PENDING":
        query = query.filter(Review.is_approved == False)
    
    if rating:
        query = query.filter(Review.rating == rating)
    
    reviews = query.order_by(Review.created_at.desc()).all()
    results = []
    for r in reviews:
        if search:
            s = search.lower()
            if not (s in (r.review or "").lower() or (r.user and s in f"{r.user.first_name} {r.user.last_name}".lower()) or (r.product and s in r.product.name.lower())):
                continue
        results.append({
            "id": r.id,
            "product_id": r.product_id,
            "product_name": r.product.name if r.product else "Unknown Product",
            "product_image": r.product.images[0].image_url if r.product and r.product.images else None,
            "user_id": r.user_id,
            "user_name": f"{r.user.first_name} {r.user.last_name}" if r.user else "Anonymous Client",
            "user_email": r.user.email if r.user else "",
            "rating": r.rating,
            "review": r.review,
            "photo_url": r.photo_url,
            "is_approved": r.is_approved,
            "created_at": r.created_at.strftime("%Y-%m-%d %H:%M") if r.created_at else ""
        })
    return results

@router.put("/reviews/{review_id}/moderate")
def moderate_review(
    review_id: int,
    req: ReviewStatusUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    rev = db.query(Review).filter(Review.id == review_id).first()
    if not rev:
        raise HTTPException(status_code=404, detail="Review not found")
    if req.is_approved is not None:
        rev.is_approved = req.is_approved
    db.commit()
    return {"message": "Review status updated successfully", "is_approved": rev.is_approved}


# ==============================================================================
# 👤 CUSTOMER 360° PROFILE ENHANCEMENTS
# ==============================================================================

@router.get("/customers/{user_id}/detail")
def get_customer_360_detail(
    user_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Customer not found")

    orders = db.query(Order).filter(Order.user_id == user_id).order_by(Order.created_at.desc()).all()
    addresses = db.query(Address).filter(Address.user_id == user_id).all()
    reviews = db.query(Review).filter(Review.user_id == user_id).all()
    wishlist = db.query(Wishlist).filter(Wishlist.user_id == user_id).all()

    total_spent = sum(o.total_amount for o in orders if o.payment_status == "Paid")
    avg_order_value = (total_spent / len(orders)) if orders else 0.0

    return {
        "id": user.id,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email,
        "role": user.role,
        "is_active": user.is_active,
        "created_at": user.created_at.strftime("%Y-%m-%d %H:%M") if user.created_at else "",
        "metrics": {
            "total_orders": len(orders),
            "paid_orders": len([o for o in orders if o.payment_status == "Paid"]),
            "lifetime_value": round(total_spent, 2),
            "average_order_value": round(avg_order_value, 2),
            "wishlist_count": len(wishlist),
            "reviews_count": len(reviews)
        },
        "addresses": [
            {
                "id": a.id,
                "street": a.street,
                "city": a.city,
                "state": a.state,
                "postal_code": a.postal_code,
                "country": a.country,
                "phone": a.phone,
                "is_default": a.is_default
            } for a in addresses
        ],
        "recent_orders": [
            {
                "id": o.id,
                "order_number": o.order_number,
                "total_amount": o.total_amount,
                "currency": o.currency,
                "payment_status": o.payment_status,
                "order_status": o.order_status,
                "created_at": o.created_at.strftime("%Y-%m-%d %H:%M") if o.created_at else ""
            } for o in orders[:10]
        ]
    }


# ==============================================================================
# 🤖 AI STUDIO: GENERATE PRODUCT COPY & SEO METADATA
# ==============================================================================

class AiCopyRequest(BaseModel):
    product_name: str
    category: str
    key_ingredients_or_fabric: Optional[str] = ""
    tone: Optional[str] = "Luxury & Sensory"
    target_benefit: Optional[str] = ""

@router.post("/ai/generate-copy")
def generate_ai_product_copy(
    req: AiCopyRequest,
    current_admin: User = Depends(get_current_admin)
):
    """
    Simulates / delivers high-end e-commerce copy tailored to Korean botanical skincare and luxury fashion.
    """
    name = req.product_name.strip()
    cat = req.category.strip().lower()
    mat = req.key_ingredients_or_fabric.strip() or "Artisanal botanicals & bio-actives"

    if "skin" in cat or "beauty" in cat or "serum" in name.lower() or "cream" in name.lower():
        description = (
            f"Immerse your daily ritual in the transcendent power of {name}. Infused with {mat}, "
            f"this multi-corrective elixir deeply hydrates, refines epidermal texture, and unlocks glass-skin radiance. "
            f"Formulated without parabens or artificial fragrance to honor sensitive skin barriers."
        )
        short_desc = f"Potent botanical formula powered by {mat} for luminous, glass-skin resilience."
        how_to_use = "Dispense 3-4 drops onto clean fingertips. Gently press into face and décolletage morning and evening before barrier creams."
        ingredients_list = f"{mat}, Centella Asiatica Extract, Niacinamide, Sodium Hyaluronate, Camellia Sinensis Leaf Water, Licorice Root Extract."
        seo_title = f"{name} | Korean Botanical Skincare Ritual — Yurae Beauty"
        seo_meta = f"Experience {name} formulated with {mat}. Nourish, calm, and reveal radiant glass skin with Yurae's clean luxury formulas."
    elif "fashion" in cat or "dress" in name.lower() or "silk" in name.lower():
        description = (
            f"Elegance redefined with {name}. Tailored from premium {mat}, this piece features graceful drape, "
            f"breathable touch, and timeless silhouette designed for effortless resort luxury and formal atelier aesthetics."
        )
        short_desc = f"Handcrafted luxury apparel tailored with {mat} for graceful, effortless silhouettes."
        how_to_use = "Dry clean or gentle cold hand wash. Steam on low heat to maintain soft fabric sheen."
        ingredients_list = f"100% Premium {mat}. Ethically sourced & artisanal stitched."
        seo_title = f"{name} | Bespoke Luxury Fashion — Yurae Atelier"
        seo_meta = f"Discover {name} crafted in bespoke {mat}. Effortless modern femininity and timeless comfort by Yurae."
    else:
        description = (
            f"Discover the signature craft of {name}. Designed with meticulous attention to detail using {mat}, "
            f"elevating your everyday luxury ensemble."
        )
        short_desc = f"Artisanal fine accent crafted with {mat}."
        how_to_use = "Store in provided velvet pouch. Avoid direct exposure to perfume and water."
        ingredients_list = f"Handcrafted with {mat}."
        seo_title = f"{name} | Artisanal Fine Jewelry & Accents — Yurae"
        seo_meta = f"Shop {name} featuring {mat}. Timeless craftsmanship and modern luxury accents by Yurae."

    return {
        "success": True,
        "generated": {
            "name": name,
            "description": description,
            "short_description": short_desc,
            "how_to_use": how_to_use,
            "ingredients": ingredients_list,
            "seo_title": seo_title,
            "seo_meta_description": seo_meta,
            "suggested_tags": [cat.capitalize(), "Luxury", "Artisanal", "Bespoke", "New Arrival"]
        }
    }


# ==============================================================================
# 📦 BULK PRODUCT OPERATIONS
# ==============================================================================

class BulkProductAction(BaseModel):
    product_ids: List[int]
    action: str  # "PUBLISH", "UNPUBLISH", "ARCHIVE", "DELETE", "RESTOCK_ALL"
    restock_quantity: Optional[int] = 10

@router.post("/products/bulk-action")
def execute_bulk_product_action(
    req: BulkProductAction,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    if not req.product_ids:
        raise HTTPException(status_code=400, detail="No products selected")

    action = req.action.upper()
    prods = db.query(Product).filter(Product.id.in_(req.product_ids)).all()

    if action == "PUBLISH":
        for p in prods:
            p.status = "ACTIVE"
        db.commit()
        return {"message": f"Successfully published {len(prods)} products."}
    elif action == "UNPUBLISH" or action == "DRAFT":
        for p in prods:
            p.status = "DRAFT"
        db.commit()
        return {"message": f"Successfully set {len(prods)} products to draft."}
    elif action == "ARCHIVE":
        for p in prods:
            p.status = "ARCHIVED"
        db.commit()
        return {"message": f"Successfully archived {len(prods)} products."}
    elif action == "RESTOCK_ALL":
        for p in prods:
            p.stock_quantity = (p.stock_quantity or 0) + (req.restock_quantity or 10)
        db.commit()
        return {"message": f"Successfully added {req.restock_quantity} units to {len(prods)} products."}
    elif action == "DELETE":
        for p in prods:
            pid = p.id
            db.execute(text("DELETE FROM pick_list_items WHERE product_id = :p OR order_item_id IN (SELECT id FROM (SELECT id FROM order_items WHERE product_id = :p) as tmp)"), {"p": pid})
            db.execute(text("DELETE FROM product_inventory_locations WHERE product_id = :p"), {"p": pid})
            db.execute(text("DELETE FROM stock_notifications WHERE product_id = :p"), {"p": pid})
            db.execute(text("DELETE FROM cart_items WHERE product_id = :p"), {"p": pid})
            db.execute(text("DELETE FROM wishlists WHERE product_id = :p"), {"p": pid})
            db.execute(text("DELETE FROM reviews WHERE product_id = :p"), {"p": pid})
            db.execute(text("DELETE FROM order_items WHERE product_id = :p"), {"p": pid})
            db.execute(text("DELETE FROM product_variants WHERE product_id = :p"), {"p": pid})
            db.execute(text("DELETE FROM product_images WHERE product_id = :p"), {"p": pid})
            db.delete(p)
        db.commit()
        return {"message": f"Successfully deleted {len(prods)} products from the catalog."}
    else:
        raise HTTPException(status_code=400, detail="Unsupported bulk action")


# ==============================================================================
# 👥 STAFF ROLES & PERMISSIONS MANAGEMENT
# ==============================================================================

class UserRoleUpdate(BaseModel):
    role: str

@router.get("/staff-members")
def get_staff_members(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    staff = db.query(User).filter(User.role != "CUSTOMER").order_by(User.created_at.desc()).all()
    return [
        {
            "id": u.id,
            "name": f"{u.first_name} {u.last_name}",
            "email": u.email,
            "role": u.role,
            "is_active": u.is_active,
            "created_at": u.created_at.strftime("%Y-%m-%d") if u.created_at else ""
        } for u in staff
    ]

@router.put("/staff-members/{user_id}/role")
def update_staff_role(
    user_id: int,
    req: UserRoleUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = req.role.upper()
    db.commit()
    return {"message": f"Updated role for {user.email} to {user.role}"}
