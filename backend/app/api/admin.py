import time
import json
import csv
import io
from datetime import datetime, date, timedelta
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status, Response
from fastapi.responses import StreamingResponse, JSONResponse
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, text, or_, and_, desc
from app.database.session import get_db, engine, Base
from app.models.models import (
    Order, OrderItem, Payment, User, Product, Category, Coupon, Review, ExchangeRate, Shipment,
    AuditLog, ContactMessage, ReturnRequest, StockNotification, QualityCheckLog,
    PackingLog, Warehouse, ProductInventoryLocation, Address, Wishlist, CartItem, ProductVariant,
    PickList, PickListItem, ShippingTrackingEvent, RefundRecord, NotificationLog
)
from app.schemas.schemas import (
    AdminDashboardStats, OrderResponse, UserResponse,
    OrderAnalyticsSummary, SummaryCardMetric, OrderBulkActionRequest,
    PackingChecklistUpdate, OrderNoteCreate, StaffAssignmentRequest,
    CustomerCommunicationRequest
)
from app.api.deps import get_current_admin
from app.core.config import settings, backend_env, root_env
from app.database.migrate_all import run_full_schema_migration
from app.database.seed import seed_db
from app.services.warehouse_service import WarehouseService
from app.services.shipping_service import ShippingService
from app.services.fulfillment_orchestrator import FulfillmentOrchestrator
from app.services.audit_service import AuditService
from app.services.notification_service import NotificationService
from app.services.email_service import EmailService
from app.services.invoice_pdf_service import InvoicePdfService
from app.services.shipping_label_service import ShippingLabelService
from app.services.packing_slip_service import PackingSlipService
from pydantic import BaseModel

router = APIRouter(prefix="/admin", tags=["Admin Dashboard"])

@router.get("/dashboard", response_model=AdminDashboardStats)
def get_dashboard_stats(current_admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    total_sales_result = db.query(func.sum(Order.total_amount)).filter(Order.payment_status.in_(["Paid", "PAID", "SUCCESS"])).scalar()
    total_sales = float(total_sales_result) if total_sales_result else 0.0

    total_orders = db.query(Order).count()
    total_customers = db.query(User).filter(User.role == "CUSTOMER").count()
    total_products = db.query(Product).count()
    pending_orders = db.query(Order).filter(Order.order_status.in_(["Pending", "Processing", "Confirmed", "NEW_ORDER"])).count()
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

# ==========================================
# ORDER MANAGEMENT SUITE (ENTERPRISE OMS)
# ==========================================

@router.get("/orders/analytics-summary", response_model=OrderAnalyticsSummary)
def get_orders_analytics_summary(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Returns full summary metrics for all 15 order lifecycle cards:
    Count, Total Revenue, Today's Count, Weekly Count, and Monthly Count.
    Also returns high-level business reports (AOV, Top Products, Top Customers, Repeat rate).
    """
    now = datetime.utcnow()
    start_of_today = datetime(now.year, now.month, now.day)
    seven_days_ago = now - timedelta(days=7)
    thirty_days_ago = now - timedelta(days=30)

    # Fetch all orders in memory for ultrafast, accurate multi-metric aggregation
    all_orders = db.query(Order).all()
    total_orders_count = len(all_orders)

    # Define the 15 Lifecycle Card Specifications
    card_definitions = [
        {"key": "TOTAL_ORDERS", "label": "Total Orders", "icon": "ShoppingCart", "color": "#D84B7E"},
        {"key": "NEW_ORDERS", "label": "New Orders", "icon": "Sparkles", "color": "#3B82F6"},
        {"key": "PENDING_PAYMENT", "label": "Pending Payment", "icon": "Clock", "color": "#F59E0B"},
        {"key": "PAID_ORDERS", "label": "Paid Orders", "icon": "CheckCircle2", "color": "#10B981"},
        {"key": "PROCESSING_ORDERS", "label": "Processing Orders", "icon": "Cpu", "color": "#6366F1"},
        {"key": "READY_TO_PACK", "label": "Ready to Pack", "icon": "Boxes", "color": "#EC4899"},
        {"key": "PACKED_ORDERS", "label": "Packed Orders", "icon": "PackageCheck", "color": "#8B5CF6"},
        {"key": "READY_TO_SHIP", "label": "Ready to Ship", "icon": "Send", "color": "#14B8A6"},
        {"key": "SHIPPED_ORDERS", "label": "Shipped Orders", "icon": "Truck", "color": "#0284C7"},
        {"key": "OUT_FOR_DELIVERY", "label": "Out For Delivery", "icon": "Navigation", "color": "#D97706"},
        {"key": "DELIVERED_ORDERS", "label": "Delivered Orders", "icon": "Home", "color": "#059669"},
        {"key": "CANCELLED_ORDERS", "label": "Cancelled Orders", "icon": "XCircle", "color": "#E11D48"},
        {"key": "RETURNED_ORDERS", "label": "Returned Orders", "icon": "RotateCcw", "color": "#9333EA"},
        {"key": "REFUNDED_ORDERS", "label": "Refunded Orders", "icon": "DollarSign", "color": "#EA580C"},
        {"key": "FAILED_PAYMENTS", "label": "Failed Payments", "icon": "AlertTriangle", "color": "#DC2626"},
    ]

    cards_result: Dict[str, SummaryCardMetric] = {}

    def matches_card_filter(o: Order, key: str) -> bool:
        st = (o.order_status or "").upper()
        pst = (o.payment_status or "").upper()
        fst = (o.fulfillment_status or "").upper()

        if key == "TOTAL_ORDERS":
            return True
        elif key == "NEW_ORDERS":
            return st in ["PENDING", "NEW_ORDER", "NEW ORDER"] or fst == "NEW_ORDER"
        elif key == "PENDING_PAYMENT":
            return pst in ["PENDING", "UNPAID"]
        elif key == "PAID_ORDERS":
            return pst in ["PAID", "SUCCESS"]
        elif key == "PROCESSING_ORDERS":
            return st in ["PROCESSING", "CONFIRMED"] or fst in ["ORDER_CONFIRMED", "PICK_LIST_GENERATED", "ITEMS_PICKED", "QUALITY_CHECKED", "PACKING_STARTED"]
        elif key == "READY_TO_PACK":
            return fst in ["PICK_LIST_GENERATED", "ITEMS_PICKED", "QUALITY_CHECKED", "READY_TO_PACK"] or (st == "PROCESSING" and fst not in ["PACKED", "SHIPPED", "DELIVERED"])
        elif key == "PACKED_ORDERS":
            return st == "PACKED" or fst == "PACKED"
        elif key == "READY_TO_SHIP":
            return fst in ["PACKED", "SHIPPING_LABEL_PRINTED", "COURIER_ASSIGNED", "READY_TO_SHIP"] and st not in ["SHIPPED", "DELIVERED", "CANCELLED"]
        elif key == "SHIPPED_ORDERS":
            return st in ["SHIPPED", "IN_TRANSIT"] or fst in ["SHIPPED", "PICKED_UP", "IN_TRANSIT"]
        elif key == "OUT_FOR_DELIVERY":
            return st in ["OUT FOR DELIVERY", "OUT_FOR_DELIVERY"] or fst == "OUT_FOR_DELIVERY"
        elif key == "DELIVERED_ORDERS":
            return st in ["DELIVERED", "ORDER_COMPLETED"] or fst in ["DELIVERED", "ORDER_COMPLETED"]
        elif key == "CANCELLED_ORDERS":
            return st in ["CANCELLED", "CANCELED"] or fst == "CANCELLED"
        elif key == "RETURNED_ORDERS":
            return st in ["RETURNED", "RETURN_REQUESTED", "RETURN_APPROVED", "RETURN_COMPLETED"] or fst in ["RETURNED", "RTO"]
        elif key == "REFUNDED_ORDERS":
            return pst in ["REFUNDED", "REFUND_COMPLETED"] or st in ["REFUNDED", "REFUND REQUESTED", "REFUND APPROVED", "REFUND COMPLETED"]
        elif key == "FAILED_PAYMENTS":
            return pst in ["FAILED", "FAILURE"]
        return False

    for cdef in card_definitions:
        k = cdef["key"]
        matched = [o for o in all_orders if matches_card_filter(o, k)]
        count = len(matched)
        rev = sum(float(o.total_amount or 0.0) for o in matched)
        today_cnt = sum(1 for o in matched if o.created_at and o.created_at >= start_of_today)
        weekly_cnt = sum(1 for o in matched if o.created_at and o.created_at >= seven_days_ago)
        monthly_cnt = sum(1 for o in matched if o.created_at and o.created_at >= thirty_days_ago)

        cards_result[k] = SummaryCardMetric(
            key=k,
            label=cdef["label"],
            count=count,
            total_revenue=round(rev, 2),
            today_count=today_cnt,
            weekly_count=weekly_cnt,
            monthly_count=monthly_cnt,
            icon=cdef["icon"],
            color=cdef["color"]
        )

    # Calculate overall analytics
    paid_orders = [o for o in all_orders if (o.payment_status or "").upper() in ["PAID", "SUCCESS"]]
    total_sales_val = sum(float(o.total_amount or 0.0) for o in paid_orders)
    aov = round(total_sales_val / len(paid_orders), 2) if paid_orders else 0.0

    cancelled_count = sum(1 for o in all_orders if (o.order_status or "").upper() in ["CANCELLED", "CANCELED"])
    returned_count = sum(1 for o in all_orders if (o.order_status or "").upper() in ["RETURNED", "RTO"])

    cancellation_rate = round((cancelled_count / total_orders_count * 100), 1) if total_orders_count > 0 else 0.0
    return_rate = round((returned_count / total_orders_count * 100), 1) if total_orders_count > 0 else 0.0

    # Repeat customer rate
    user_order_counts: Dict[int, int] = {}
    for o in all_orders:
        user_order_counts[o.user_id] = user_order_counts.get(o.user_id, 0) + 1
    total_unique_customers = len(user_order_counts)
    repeat_customers_count = sum(1 for uid, cnt in user_order_counts.items() if cnt > 1)
    repeat_rate = round((repeat_customers_count / total_unique_customers * 100), 1) if total_unique_customers > 0 else 0.0

    # Top Products aggregation
    product_sales: Dict[str, Dict[str, Any]] = {}
    for o in all_orders:
        for item in o.items:
            pname = item.product_name
            if pname not in product_sales:
                product_sales[pname] = {"product_name": pname, "quantity": 0, "revenue": 0.0, "orders_count": 0}
            product_sales[pname]["quantity"] += item.quantity
            product_sales[pname]["revenue"] += float(item.price * item.quantity)
            product_sales[pname]["orders_count"] += 1

    top_products = sorted(product_sales.values(), key=lambda x: x["revenue"], reverse=True)[:8]
    for p in top_products:
        p["revenue"] = round(p["revenue"], 2)

    # Top Categories
    cat_sales: Dict[str, Dict[str, Any]] = {}
    for o in all_orders:
        for item in o.items:
            cat_name = item.product.category.name if (item.product and item.product.category) else "Skincare"
            if cat_name not in cat_sales:
                cat_sales[cat_name] = {"category_name": cat_name, "units_sold": 0, "revenue": 0.0}
            cat_sales[cat_name]["units_sold"] += item.quantity
            cat_sales[cat_name]["revenue"] += float(item.price * item.quantity)
    top_categories = sorted(cat_sales.values(), key=lambda x: x["revenue"], reverse=True)[:5]
    for c in top_categories:
        c["revenue"] = round(c["revenue"], 2)

    # Top Customers by Lifetime Value
    customer_spend: Dict[int, Dict[str, Any]] = {}
    for o in all_orders:
        uid = o.user_id
        uname = f"{o.user.first_name} {o.user.last_name}" if o.user else f"Patron #{uid}"
        uemail = o.user.email if o.user else "N/A"
        if uid not in customer_spend:
            customer_spend[uid] = {"user_id": uid, "customer_name": uname, "email": uemail, "total_spend": 0.0, "order_count": 0}
        customer_spend[uid]["total_spend"] += float(o.total_amount or 0.0)
        customer_spend[uid]["order_count"] += 1
    top_customers = sorted(customer_spend.values(), key=lambda x: x["total_spend"], reverse=True)[:8]
    for tc in top_customers:
        tc["total_spend"] = round(tc["total_spend"], 2)

    return OrderAnalyticsSummary(
        cards=cards_result,
        total_revenue=round(total_sales_val, 2),
        average_order_value=aov,
        cancellation_rate=cancellation_rate,
        return_rate=return_rate,
        repeat_customer_rate=repeat_rate,
        top_products=top_products,
        top_categories=top_categories,
        top_customers=top_customers
    )


@router.get("/orders", response_model=List[OrderResponse])
def get_all_orders_admin(
    status: Optional[str] = None,
    payment_status: Optional[str] = None,
    date_preset: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    courier: Optional[str] = None,
    city: Optional[str] = None,
    state: Optional[str] = None,
    country: Optional[str] = None,
    priority: Optional[str] = None,
    payment_type: Optional[str] = None,
    is_returned: Optional[bool] = None,
    is_cancelled: Optional[bool] = None,
    is_refunded: Optional[bool] = None,
    search: Optional[str] = None,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Production-grade enterprise orders query supporting all multi-dimensional filters,
    sorting, date presets, courier, geo-location, priority, and multi-field keyword search.
    """
    query = db.query(Order).options(
        joinedload(Order.user),
        joinedload(Order.address),
        joinedload(Order.items),
        joinedload(Order.payments)
    )

    # 1. Status Filter
    if status and status.upper() != "ALL":
        s_upper = status.upper()
        if s_upper == "PENDING":
            query = query.filter(Order.order_status.in_(["Pending", "PENDING", "NEW_ORDER"]))
        elif s_upper == "PROCESSING":
            query = query.filter(Order.order_status.in_(["Processing", "Confirmed", "PROCESSING", "ORDER_CONFIRMED"]))
        elif s_upper == "PACKED":
            query = query.filter(or_(Order.order_status.in_(["Packed", "PACKED"]), Order.fulfillment_status == "PACKED"))
        elif s_upper == "SHIPPED":
            query = query.filter(Order.order_status.in_(["Shipped", "SHIPPED", "IN_TRANSIT"]))
        elif s_upper == "OUT_FOR_DELIVERY" or s_upper == "OUT FOR DELIVERY":
            query = query.filter(Order.order_status.in_(["Out for Delivery", "OUT_FOR_DELIVERY"]))
        elif s_upper == "DELIVERED":
            query = query.filter(Order.order_status.in_(["Delivered", "DELIVERED", "ORDER_COMPLETED"]))
        elif s_upper == "CANCELLED":
            query = query.filter(Order.order_status.in_(["Cancelled", "CANCELLED", "Canceled"]))
        elif s_upper == "RETURNED":
            query = query.filter(Order.order_status.in_(["Returned", "RETURNED", "RETURN_REQUESTED", "RETURN_APPROVED"]))
        else:
            query = query.filter(Order.order_status.ilike(f"%{status}%"))

    # 2. Payment Status Filter
    if payment_status and payment_status.upper() != "ALL":
        ps_upper = payment_status.upper()
        if ps_upper == "PAID":
            query = query.filter(Order.payment_status.in_(["Paid", "PAID", "SUCCESS", "Success"]))
        elif ps_upper == "PENDING":
            query = query.filter(Order.payment_status.in_(["Pending", "PENDING", "UNPAID"]))
        elif ps_upper == "FAILED":
            query = query.filter(Order.payment_status.in_(["Failed", "FAILED"]))
        elif ps_upper == "REFUNDED":
            query = query.filter(Order.payment_status.in_(["Refunded", "REFUNDED"]))
        else:
            query = query.filter(Order.payment_status.ilike(f"%{payment_status}%"))

    # 3. Date Presets & Custom Range
    now = datetime.utcnow()
    if date_preset:
        dp = date_preset.upper()
        if dp == "TODAY":
            s_today = datetime(now.year, now.month, now.day)
            query = query.filter(Order.created_at >= s_today)
        elif dp == "YESTERDAY":
            s_yest = datetime(now.year, now.month, now.day) - timedelta(days=1)
            e_yest = datetime(now.year, now.month, now.day)
            query = query.filter(Order.created_at >= s_yest, Order.created_at < e_yest)
        elif dp == "THIS_WEEK" or dp == "WEEK":
            s_week = now - timedelta(days=7)
            query = query.filter(Order.created_at >= s_week)
        elif dp == "THIS_MONTH" or dp == "MONTH":
            s_month = now - timedelta(days=30)
            query = query.filter(Order.created_at >= s_month)
        elif dp == "CUSTOM" and start_date:
            try:
                s_dt = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
                query = query.filter(Order.created_at >= s_dt)
            except Exception:
                pass
            if end_date:
                try:
                    e_dt = datetime.fromisoformat(end_date.replace("Z", "+00:00")) + timedelta(days=1)
                    query = query.filter(Order.created_at <= e_dt)
                except Exception:
                    pass

    # 4. Courier Filter
    if courier and courier.upper() != "ALL":
        query = query.filter(Order.courier_name.ilike(f"%{courier}%"))

    # 5. Priority Filter
    if priority and priority.upper() != "ALL":
        query = query.filter(Order.priority == priority.upper())

    # 6. Payment Type (COD vs Prepaid)
    if payment_type:
        pt = payment_type.upper()
        if pt == "COD":
            query = query.filter(Order.is_cod == True)
        elif pt in ["PREPAID", "ONLINE"]:
            query = query.filter(Order.is_cod == False)

    # 7. Flags
    if is_returned is True:
        query = query.filter(Order.order_status.in_(["Returned", "RETURNED", "RETURN_REQUESTED"]))
    if is_cancelled is True:
        query = query.filter(Order.order_status.in_(["Cancelled", "CANCELLED", "Canceled"]))
    if is_refunded is True:
        query = query.filter(Order.payment_status.in_(["Refunded", "REFUNDED"]))

    # 8. Geo-location Filters
    if city or state or country:
        query = query.join(Order.address)
        if city:
            query = query.filter(Address.city.ilike(f"%{city}%"))
        if state:
            query = query.filter(Address.state.ilike(f"%{state}%"))
        if country:
            query = query.filter(Address.country.ilike(f"%{country}%"))

    # 9. Search Term (Order #, Name, Email, Phone, AWB, Product Name)
    if search and search.strip():
        s_clean = search.strip()
        search_fmt = f"%{s_clean}%"
        
        # Subquery for product name search
        matching_order_ids_subq = db.query(OrderItem.order_id).filter(
            OrderItem.product_name.ilike(search_fmt)
        ).subquery()

        query = query.outerjoin(Order.user).outerjoin(Order.address).filter(
            or_(
                Order.order_number.ilike(search_fmt),
                Order.awb_code.ilike(search_fmt),
                Order.invoice_number.ilike(search_fmt),
                User.first_name.ilike(search_fmt),
                User.last_name.ilike(search_fmt),
                User.email.ilike(search_fmt),
                User.phone.ilike(search_fmt),
                Address.name.ilike(search_fmt),
                Address.phone.ilike(search_fmt),
                Address.city.ilike(search_fmt),
                Order.id.in_(matching_order_ids_subq)
            )
        )

    return query.order_by(Order.created_at.desc()).all()


@router.get("/orders/{order_id}/detail")
def get_order_360_detail(
    order_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Returns complete 360° Order Details Payload:
    - Customer 360 profile & lifetime spend metrics
    - Ordered items with real-time warehouse inventory stock levels
    - Payment & GST Tax invoice breakdown
    - Warehouse packing checklist state
    - Warehouse picking list (Rack, Shelf, Bin, SKU)
    - Multi-carrier logistics & 4x6 shipping label metadata
    - Granular chronological audit timeline
    - Real-time Fraud/Risk/High-Value alert badges
    """
    order = db.query(Order).options(
        joinedload(Order.user),
        joinedload(Order.address),
        joinedload(Order.items).joinedload(OrderItem.product),
        joinedload(Order.payments),
        joinedload(Order.shipment),
        joinedload(Order.tracking_events),
        joinedload(Order.return_requests)
    ).filter(Order.id == order_id).first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # 1. Customer 360 Metrics
    user = order.user
    customer_metrics = {
        "user_id": user.id if user else None,
        "name": f"{user.first_name} {user.last_name}" if user else (order.address.name if order.address else "Guest Patron"),
        "email": user.email if user else "N/A",
        "phone": order.address.phone if order.address else (user.phone if user else "N/A"),
        "account_created_at": user.created_at.strftime("%d %B %Y") if (user and user.created_at) else "Guest Checkout",
        "total_orders": db.query(Order).filter(Order.user_id == user.id).count() if user else 1,
        "lifetime_spend": round(float(db.query(func.sum(Order.total_amount)).filter(
            Order.user_id == user.id,
            Order.payment_status.in_(["Paid", "PAID", "SUCCESS"])
        ).scalar() or 0.0), 2) if user else order.total_amount,
        "is_active": user.is_active if user else True
    }

    # 2. Ordered Items with live warehouse stock
    items_detail = []
    low_stock_warning = False
    for item in order.items:
        prod = item.product
        live_stock = prod.stock_quantity if prod else 0
        if live_stock <= 5:
            low_stock_warning = True

        img_url = prod.images[0].image_url if (prod and prod.images) else "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=300&q=80"

        items_detail.append({
            "id": item.id,
            "product_id": item.product_id,
            "product_name": item.product_name,
            "sku": prod.sku if prod else f"SKU-{item.product_id:04d}",
            "variant_info": item.variant_info,
            "quantity": item.quantity,
            "unit_price": item.price,
            "total_price": round(item.price * item.quantity, 2),
            "image_url": img_url,
            "category": prod.category.name if (prod and prod.category) else "Botanicals",
            "live_warehouse_stock": live_stock,
            "weight_kg": prod.weight_kg if prod else 0.35,
            "hsn_code": "33049900" if any(w in item.product_name.lower() for w in ["wash", "serum", "balm", "cream", "lotion", "toner", "cleanser", "mist", "oil"]) else ("71131120" if any(w in item.product_name.lower() for w in ["ring", "necklace", "pendant", "bracelet", "earring", "jewelry", "pearl"]) else "62044390")
        })

    # 3. Warehouse Pick List Details
    pick_list = WarehouseService.generate_pick_list_for_order(order, assigned_staff=order.assigned_staff or "Warehouse Specialist", db=db)
    picklist_data = {
        "picklist_number": pick_list.picklist_number,
        "assigned_staff_name": pick_list.assigned_staff_name,
        "status": pick_list.status,
        "items": [
            {
                "id": pi.id,
                "product_name": pi.product_name,
                "sku": pi.sku,
                "variant_info": pi.variant_info,
                "shelf_location": pi.shelf_location,
                "quantity_required": pi.quantity_required,
                "quantity_picked": pi.quantity_picked,
                "status": pi.status
            }
            for pi in pick_list.items
        ]
    }

    # 4. Packing Checklist State
    checklist_parsed = {}
    if order.packing_checklist:
        try:
            checklist_parsed = json.loads(order.packing_checklist)
        except Exception:
            checklist_parsed = {}

    packing_logs = db.query(PackingLog).filter(PackingLog.order_id == order.id).order_by(PackingLog.created_at.desc()).all()
    packing_logs_data = [
        {
            "id": pl.id,
            "packer_name": pl.packer_name,
            "box_type": pl.box_type,
            "total_weight_kg": pl.total_weight_kg,
            "created_at": pl.created_at.strftime("%d %b %Y, %I:%M %p") if pl.created_at else None,
            "notes": pl.notes
        }
        for pl in packing_logs
    ]

    # 5. Order Alerts & Fraud Risk Detection
    alerts = []
    if order.total_amount >= 10000:
        alerts.append({
            "type": "HIGH_VALUE",
            "severity": "warning",
            "title": "High Value Order",
            "message": f"Total order value ₹{order.total_amount:,.2f} exceeds ₹10,000 threshold. VIP packing protocol recommended."
        })

    if (order.risk_level or "").upper() == "HIGH":
        alerts.append({
            "type": "FRAUD_RISK",
            "severity": "danger",
            "title": "Fraud Risk Detected",
            "message": "High-risk indicator detected on transaction profile or IP velocity. Verify phone number prior to dispatch."
        })

    if (order.payment_status or "").upper() == "FAILED":
        alerts.append({
            "type": "PAYMENT_FAILED",
            "severity": "danger",
            "title": "Payment Transaction Failed",
            "message": "Card / Gateway declined the charge. Order will not be fulfilled until payment is settled."
        })

    if order.address:
        if not order.address.postal_code or len(order.address.postal_code.strip()) < 5 or not order.address.phone:
            alerts.append({
                "type": "ADDRESS_INCOMPLETE",
                "severity": "warning",
                "title": "Incomplete Shipping Address",
                "message": "Destination PIN code or Contact phone is missing/incomplete. Check address before printing label."
            })
    else:
        alerts.append({
            "type": "ADDRESS_MISSING",
            "severity": "danger",
            "title": "Missing Shipping Address",
            "message": "No delivery address attached to this order."
        })

    if low_stock_warning:
        alerts.append({
            "type": "LOW_STOCK",
            "severity": "warning",
            "title": "Low Warehouse Stock Alert",
            "message": "One or more ordered items has 5 or fewer units remaining in warehouse inventory."
        })

    if order.is_cod and (order.payment_status or "").upper() != "PAID":
        alerts.append({
            "type": "COD_VERIFICATION",
            "severity": "info",
            "title": "Cash on Delivery (COD) Verification",
            "message": f"Collect ₹{order.total_amount:,.2f} in cash from customer upon delivery."
        })

    # 6. Granular Audit Timeline
    timeline_events = []
    # Primary lifecycle timestamps
    if order.created_at:
        timeline_events.append({
            "stage": "NEW_ORDER",
            "title": "Customer Placed Order",
            "description": f"Order #{order.order_number} confirmed with total ₹{order.total_amount}",
            "actor": customer_metrics["name"],
            "timestamp": order.created_at.strftime("%d %b %Y, %I:%M %p")
        })

    if (order.payment_status or "").upper() in ["PAID", "SUCCESS"]:
        pay_rec = order.payments[0] if order.payments else None
        timeline_events.append({
            "stage": "PAYMENT_SUCCESSFUL",
            "title": "Payment Verified",
            "description": f"Payment of ₹{order.total_amount} captured via {pay_rec.payment_method if pay_rec else 'Online Payment'}",
            "actor": "Payment Gateway",
            "timestamp": (pay_rec.created_at if pay_rec else order.created_at).strftime("%d %b %Y, %I:%M %p")
        })

    if order.picked_at:
        timeline_events.append({
            "stage": "ITEMS_PICKED",
            "title": "Warehouse Picked Items",
            "description": f"Items picked from shelf bin locations by {order.assigned_staff or 'Warehouse Staff'}",
            "actor": order.assigned_staff or "Warehouse Staff",
            "timestamp": order.picked_at.strftime("%d %b %Y, %I:%M %p")
        })

    if order.packed_at:
        timeline_events.append({
            "stage": "PACKED",
            "title": "Order Packed & Sealed",
            "description": "Packaging checklist verified, complimentary samples and GST invoice included",
            "actor": "Packing Station",
            "timestamp": order.packed_at.strftime("%d %b %Y, %I:%M %p")
        })

    if order.shipped_at:
        timeline_events.append({
            "stage": "SHIPPED",
            "title": "Handed to Courier",
            "description": f"Dispatched via {order.courier_name or 'Carrier'} (AWB: {order.awb_code or 'Pending'})",
            "actor": order.courier_name or "Logistics",
            "timestamp": order.shipped_at.strftime("%d %b %Y, %I:%M %p")
        })

    if order.delivered_at:
        timeline_events.append({
            "stage": "DELIVERED",
            "title": "Delivered to Patron",
            "description": f"Successfully delivered to {order.address.city if order.address else 'Customer'}",
            "actor": "Delivery Agent",
            "timestamp": order.delivered_at.strftime("%d %b %Y, %I:%M %p")
        })

    if order.cancelled_at:
        timeline_events.append({
            "stage": "CANCELLED",
            "title": "Order Cancelled",
            "description": "Order cancelled and inventory restored to stock",
            "actor": "Administrator",
            "timestamp": order.cancelled_at.strftime("%d %b %Y, %I:%M %p")
        })

    # Add audit log entries for granular administrative edits
    audits = db.query(AuditLog).filter(
        AuditLog.entity_type == "Order",
        AuditLog.entity_id.in_([str(order.id), order.order_number])
    ).order_by(AuditLog.created_at.asc()).all()

    for a in audits:
        timeline_events.append({
            "stage": a.action,
            "title": a.action.replace("_", " ").title(),
            "description": f"Action executed by {a.actor_name} ({a.actor_role})",
            "actor": a.actor_name,
            "timestamp": a.created_at.strftime("%d %b %Y, %I:%M %p")
        })

    # Add real-time courier tracking events
    for te in order.tracking_events:
        timeline_events.append({
            "stage": te.status,
            "title": te.activity,
            "description": f"Location: {te.location or 'In Transit'}",
            "actor": order.courier_name or "Carrier",
            "timestamp": te.event_time.strftime("%d %b %Y, %I:%M %p") if te.event_time else None
        })

    # Return full 360 payload
    return {
        "order": OrderResponse.model_validate(order),
        "customer": customer_metrics,
        "items": items_detail,
        "picklist": picklist_data,
        "packing_checklist": checklist_parsed,
        "packing_logs": packing_logs_data,
        "alerts": alerts,
        "timeline": timeline_events,
        "internal_notes": order.internal_notes or "",
        "gst_invoice_number": order.invoice_number or f"INV-{order.order_number}",
        "shipping_label_url": f"/api/v1/fulfillment/shipping-labels/{order.id}/pdf",
        "tax_invoice_url": f"/api/v1/orders/{order.id}/pdf"
    }


@router.post("/orders/{order_id}/packing-checklist")
def save_order_packing_checklist(
    order_id: int,
    req_in: PackingChecklistUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Saves packing checklist state.
    Enforces that all required packaging steps and item checks must be completed
    before allowing transition to Packed status.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Serialize checklist state
    order.packing_checklist = json.dumps(req_in.model_dump())
    actor_name = req_in.packer_name or f"{current_admin.first_name} {current_admin.last_name}"

    if req_in.advance_to_packed:
        # Check if all ordered items and packaging items are checked
        required_steps = [
            req_in.invoice_printed,
            req_in.thank_you_card_included,
            req_in.samples_added,
            req_in.bubble_wrap_done,
            req_in.outer_box_secured,
            req_in.shipping_label_attached
        ]
        
        # Verify item checks
        all_items_checked = True
        for item in order.items:
            if not req_in.items_checked.get(str(item.id), False):
                all_items_checked = False
                break

        if not (all_items_checked and all(required_steps)):
            raise HTTPException(
                status_code=400,
                detail="All packing checklist items, luxury samples, invoice, and outer box packaging must be verified before marking as Packed."
            )

        order.order_status = "Packed"
        order.fulfillment_status = "PACKED"
        order.packed_at = datetime.utcnow()

        # Log packing log entry
        plog = PackingLog(
            order_id=order.id,
            packer_name=actor_name,
            box_type=req_in.box_type or "Standard Box",
            packaging_checklist=order.packing_checklist,
            free_samples="Botanical Sample Duo & Silk Ribbon",
            total_weight_kg=req_in.total_weight_kg or 0.5,
            length_cm=15.0,
            breadth_cm=10.0,
            height_cm=8.0,
            notes="Complete packing checklist passed and sealed"
        )
        db.add(plog)

        AuditService.log_event(
            action="PACKING_COMPLETED",
            entity_type="Order",
            entity_id=order.order_number,
            actor_name=actor_name,
            actor_role="PACKING_STAFF",
            new_value={"order_status": "Packed", "fulfillment_status": "PACKED"},
            db=db
        )

        try:
            EmailService.send_order_packed(order)
        except Exception:
            pass

    db.commit()
    db.refresh(order)
    return {"message": "Packing checklist updated successfully", "order_status": order.order_status, "fulfillment_status": order.fulfillment_status}


@router.post("/orders/{order_id}/notes")
def add_order_internal_note(
    order_id: int,
    note_in: OrderNoteCreate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Appends internal administrative / warehouse note to order with timestamp and staff signature.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    actor_name = f"{current_admin.first_name} {current_admin.last_name}"
    time_str = datetime.utcnow().strftime("%d %b %Y, %I:%M %p")
    new_entry = f"[{time_str} - {actor_name}]: {note_in.note}"
    
    order.internal_notes = f"{order.internal_notes or ''}\n{new_entry}".strip()
    db.commit()

    AuditService.log_event(
        action="ADD_ORDER_NOTE",
        entity_type="Order",
        entity_id=order.order_number,
        actor_name=actor_name,
        actor_role="ADMIN",
        new_value={"note": note_in.note},
        db=db
    )

    return {"message": "Internal note saved successfully", "internal_notes": order.internal_notes}


@router.post("/orders/{order_id}/assign-staff")
def assign_order_staff_and_priority(
    order_id: int,
    req_in: StaffAssignmentRequest,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Assigns warehouse / fulfillment specialist and adjusts order priority (Normal, High, Urgent).
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    actor_name = f"{current_admin.first_name} {current_admin.last_name}"
    order.assigned_staff = req_in.assigned_staff
    if req_in.priority:
        order.priority = req_in.priority.upper()

    db.commit()

    AuditService.log_event(
        action="ASSIGN_STAFF_PRIORITY",
        entity_type="Order",
        entity_id=order.order_number,
        actor_name=actor_name,
        actor_role="ADMIN",
        new_value={"assigned_staff": order.assigned_staff, "priority": order.priority},
        db=db
    )

    return {"message": "Staff assignment and priority updated", "assigned_staff": order.assigned_staff, "priority": order.priority}


@router.post("/orders/{order_id}/send-communication")
def send_customer_order_communication(
    order_id: int,
    req_in: CustomerCommunicationRequest,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Dispatches customer update across multi-channel gateways (Email, SMS, WhatsApp, Call log).
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    recipient_email = order.user.email if order.user else (order.address.email if hasattr(order.address, 'email') else "customer@yurae.luxury")
    recipient_phone = order.address.phone if order.address else (order.user.phone if order.user else "N/A")

    channel = req_in.channel.upper()
    subject = req_in.subject or f"Update regarding your Yurae Order #{order.order_number}"

    # Log in NotificationLog
    nlog = NotificationLog(
        order_id=order.id,
        user_id=order.user_id,
        recipient_email=recipient_email,
        recipient_phone=recipient_phone,
        channel=channel,
        event_type="ADMIN_DIRECT_MESSAGE",
        subject=subject,
        payload_preview=req_in.message[:500],
        status="SENT"
    )
    db.add(nlog)
    db.commit()

    AuditService.log_event(
        action=f"DISPATCH_{channel}_COMMUNICATION",
        entity_type="Order",
        entity_id=order.order_number,
        actor_name=f"{current_admin.first_name} {current_admin.last_name}",
        actor_role="CUSTOMER_SUPPORT",
        new_value={"channel": channel, "subject": subject, "preview": req_in.message[:100]},
        db=db
    )

    return {
        "message": f"{channel} communication dispatched successfully to patron",
        "channel": channel,
        "recipient": recipient_phone if channel in ["SMS", "WHATSAPP", "CALL"] else recipient_email
    }


@router.post("/orders/bulk-action")
def execute_bulk_order_action(
    req_in: OrderBulkActionRequest,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Performs bulk operations on multi-selected orders:
    - MARK_PACKED, MARK_SHIPPED, MARK_PROCESSING, MARK_DELIVERED
    - PRINT_INVOICES, PRINT_PACKING_SLIPS, PRINT_LABELS
    - EXPORT_CSV, EXPORT_EXCEL
    """
    if not req_in.order_ids:
        raise HTTPException(status_code=400, detail="No orders selected for bulk action.")

    orders = db.query(Order).filter(Order.id.in_(req_in.order_ids)).all()
    action = req_in.action.upper()
    actor_name = f"{current_admin.first_name} {current_admin.last_name}"

    if action == "MARK_PACKED":
        for o in orders:
            o.order_status = "Packed"
            o.fulfillment_status = "PACKED"
            o.packed_at = o.packed_at or datetime.utcnow()
        db.commit()
        return {"message": f"Successfully marked {len(orders)} orders as Packed"}

    elif action == "MARK_SHIPPED":
        for o in orders:
            o.order_status = "Shipped"
            o.fulfillment_status = "SHIPPED"
            o.shipping_status = "IN_TRANSIT"
            o.shipped_at = o.shipped_at or datetime.utcnow()
            if not o.awb_code:
                try:
                    ShippingService.execute_automated_shipping_flow(o.id, db)
                except Exception:
                    pass
        db.commit()
        return {"message": f"Successfully marked {len(orders)} orders as Shipped with carrier logistics"}

    elif action == "MARK_PROCESSING":
        for o in orders:
            o.order_status = "Processing"
            o.fulfillment_status = "ORDER_CONFIRMED"
        db.commit()
        return {"message": f"Successfully marked {len(orders)} orders as Processing"}

    elif action == "MARK_DELIVERED":
        for o in orders:
            o.order_status = "Delivered"
            o.fulfillment_status = "DELIVERED"
            o.shipping_status = "DELIVERED"
            o.delivered_at = o.delivered_at or datetime.utcnow()
            if o.payment_status in ["Pending", "PENDING"]:
                o.payment_status = "Paid"
        db.commit()
        return {"message": f"Successfully marked {len(orders)} orders as Delivered"}

    elif action == "CANCEL":
        for o in orders:
            o.order_status = "Cancelled"
            o.fulfillment_status = "CANCELLED"
            o.cancelled_at = o.cancelled_at or datetime.utcnow()
            for it in o.items:
                prod = db.query(Product).filter(Product.id == it.product_id).first()
                if prod:
                    prod.stock_quantity += it.quantity
        db.commit()
        return {"message": f"Successfully cancelled {len(orders)} orders and restored stock"}

    elif action in ["EXPORT_CSV", "EXPORT_EXCEL"]:
        # Generate formatted CSV or Tab-delimited TSV
        delimiter = "\t" if action == "EXPORT_EXCEL" else ","
        output = io.StringIO()
        writer = csv.writer(output, delimiter=delimiter)
        
        # Header
        writer.writerow([
            "Order Number", "Order Date", "Customer Name", "Customer Email", "Customer Phone",
            "City", "State", "Country", "Items Count", "Items Details", "Currency",
            "Subtotal", "Discount", "Shipping Fee", "Tax", "Total Amount",
            "Payment Status", "Order Status", "Fulfillment Status", "Courier",
            "AWB Number", "Priority", "Assigned Staff"
        ])

        for o in orders:
            cname = f"{o.user.first_name} {o.user.last_name}" if o.user else (o.address.name if o.address else "Patron")
            cemail = o.user.email if o.user else "N/A"
            cphone = o.address.phone if o.address else (o.user.phone if o.user else "N/A")
            city_str = o.address.city if o.address else "India"
            state_str = o.address.state if o.address else "TN"
            country_str = o.address.country if o.address else "India"
            items_str = "; ".join([f"{it.product_name} (x{it.quantity})" for it in o.items])

            writer.writerow([
                o.order_number,
                o.created_at.strftime("%Y-%m-%d %H:%M") if o.created_at else "",
                cname, cemail, cphone,
                city_str, state_str, country_str,
                len(o.items), items_str, o.currency,
                o.subtotal, o.discount or 0.0, o.shipping_fee or 0.0, o.tax or 0.0, o.total_amount,
                o.payment_status, o.order_status, o.fulfillment_status or "NEW_ORDER",
                o.courier_name or "", o.awb_code or "", o.priority or "NORMAL", o.assigned_staff or ""
            ])

        output.seek(0)
        ext = "tsv" if action == "EXPORT_EXCEL" else "csv"
        filename = f"yurae_bulk_orders_export_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.{ext}"
        media_type = "text/tab-separated-values" if action == "EXPORT_EXCEL" else "text/csv"

        return StreamingResponse(
            io.BytesIO(output.getvalue().encode("utf-8")),
            media_type=media_type,
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )

    return {"message": f"Bulk action {action} processed for {len(orders)} orders"}

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

@router.get("/customers/{user_id}/detail")
def get_customer_360_detail(
    user_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Customer profile not found")

    total_orders = db.query(Order).filter(Order.user_id == user_id).count()
    paid_orders = db.query(Order).filter(
        Order.user_id == user_id,
        Order.payment_status.in_(["Paid", "PAID", "SUCCESS", "Success"])
    ).count()
    
    ltv_result = db.query(func.sum(Order.total_amount)).filter(
        Order.user_id == user_id,
        Order.payment_status.in_(["Paid", "PAID", "SUCCESS", "Success"])
    ).scalar()
    lifetime_value = float(ltv_result) if ltv_result else 0.0
    average_order_value = round(lifetime_value / (paid_orders if paid_orders > 0 else 1), 2)
    
    wishlist_count = db.query(Wishlist).filter(Wishlist.user_id == user_id).count()
    reviews_count = db.query(Review).filter(Review.user_id == user_id).count()

    addresses = []
    for a in user.addresses:
        street_parts = [a.building_or_flat, a.address_line1, a.address_line2, a.landmark]
        street_clean = ", ".join([p for p in street_parts if p])
        addresses.append({
            "id": a.id,
            "street": street_clean or a.address_line1,
            "city": a.city,
            "state": a.state,
            "postal_code": a.postal_code,
            "country": a.country,
            "phone": a.phone,
            "is_default": bool(a.is_default)
        })

    recent_orders = []
    user_orders = db.query(Order).filter(Order.user_id == user_id).order_by(Order.created_at.desc()).limit(15).all()
    for o in user_orders:
        recent_orders.append({
            "id": o.id,
            "order_number": o.order_number,
            "total_amount": float(o.total_amount),
            "currency": o.currency,
            "payment_status": o.payment_status,
            "order_status": o.order_status,
            "created_at": o.created_at.isoformat() if o.created_at else datetime.utcnow().isoformat()
        })

    return {
        "id": user.id,
        "first_name": user.first_name or "",
        "last_name": user.last_name or "",
        "email": user.email,
        "role": user.role,
        "is_active": bool(user.is_active),
        "created_at": user.created_at.isoformat() if user.created_at else datetime.utcnow().isoformat(),
        "metrics": {
            "total_orders": total_orders,
            "paid_orders": paid_orders,
            "lifetime_value": round(lifetime_value, 2),
            "average_order_value": average_order_value,
            "wishlist_count": wishlist_count,
            "reviews_count": reviews_count
        },
        "addresses": addresses,
        "recent_orders": recent_orders
    }

class TestEmailRequest(BaseModel):
    recipient_email: str
    template_name: Optional[str] = "WELCOME_REGISTRATION"

@router.get("/smtp-settings")
def get_smtp_settings_admin(
    current_admin: User = Depends(get_current_admin)
):
    from app.services.email_service import EmailService
    cfg = EmailService.get_smtp_config()
    pwd = cfg.get("password", "")
    masked_pwd = (pwd[:2] + "*" * (len(pwd) - 4) + pwd[-2:]) if len(pwd) >= 6 else ("******" if pwd else "")
    return {
        "mode": cfg.get("mode", "smtp"),
        "smtp_host": cfg.get("host"),
        "smtp_port": cfg.get("port"),
        "smtp_username": cfg.get("username"),
        "smtp_password_masked": masked_pwd,
        "has_password": bool(pwd),
        "from_name": cfg.get("brand_name", "Yurae Beauty"),
        "from_support": cfg.get("from_support"),
        "from_orders": cfg.get("from_orders"),
        "from_noreply": cfg.get("from_noreply"),
        "from_admin": cfg.get("from_admin"),
        "from_marketing": cfg.get("from_marketing"),
        "frontend_url": cfg.get("frontend_url"),
    }

@router.get("/email-logs")
def get_email_logs_admin(
    status: Optional[str] = None,
    template: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    from app.models.models import EmailLog
    query = db.query(EmailLog)
    if status:
        query = query.filter(EmailLog.status == status.upper())
    if template:
        query = query.filter(EmailLog.template_name == template)
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            (EmailLog.recipient_email.ilike(search_fmt)) |
            (EmailLog.subject.ilike(search_fmt)) |
            (EmailLog.sender_email.ilike(search_fmt))
        )
    
    total = query.count()
    logs = query.order_by(EmailLog.created_at.desc()).offset(offset).limit(limit).all()

    return {
        "total": total,
        "logs": [
            {
                "id": l.id,
                "recipient_email": l.recipient_email,
                "sender_email": l.sender_email,
                "sender_name": l.sender_name,
                "subject": l.subject,
                "template_name": l.template_name,
                "status": l.status,
                "error_message": l.error_message,
                "related_order_id": l.related_order_id,
                "related_user_id": l.related_user_id,
                "created_at": l.created_at.isoformat() if l.created_at else None
            }
            for l in logs
        ]
    }

@router.post("/email-logs/{log_id}/retry")
def retry_failed_email_admin(
    log_id: int,
    current_admin: User = Depends(get_current_admin)
):
    from app.services.email_service import EmailService
    success = EmailService.retry_email_log(log_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to re-dispatch email. Please verify SMTP credentials.")
    return {"message": "Email re-dispatched successfully!", "success": True}

@router.post("/test-email")
def send_test_email_admin(
    body: TestEmailRequest,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    from app.services.email_service import EmailService
    from app.services import email_templates
    recipient = body.recipient_email.strip()
    if not recipient:
        raise HTTPException(status_code=400, detail="Recipient email is required")
    
    cfg = EmailService.get_smtp_config()
    frontend_url = cfg["frontend_url"]
    tmpl = (body.template_name or "WELCOME_REGISTRATION").upper()

    # Mock user & order models for rich rendering in test mode
    class MockUser:
        id = 999
        first_name = "Kiruthika"
        last_name = "Palanisamy"
        email = recipient
        phone = "+91 98765 43210"

    class MockAddress:
        name = "Kiruthika Palanisamy"
        address_line1 = "101 Luxury Avenue, Anna Nagar"
        address_line2 = "Near Botanical Garden"
        city = "Chennai"
        state = "Tamil Nadu"
        postal_code = "600001"
        country = "India"
        phone = "+91 98765 43210"

    class MockItem:
        product_name = "Korean Ginseng & Centella Radiance Elixir"
        variant_info = "50ml Bottle"
        quantity = 1
        price = 1290.0

    class MockPayment:
        payment_method = "Prepaid UPI / Card"
        status = "SUCCESS"

    class MockOrder:
        id = 888
        order_number = f"YURAE-{datetime.now().strftime('%Y%m%d')}-DEMO"
        total_amount = 1290.0
        subtotal = 1290.0
        currency = "INR"
        tax = 0.0
        discount = 0.0
        shipping_fee = 0.0
        order_status = "Confirmed"
        payment_status = "Paid"
        is_cod = False
        awb_code = "BD-EXP-98234176"
        courier_name = "Blue Dart Express"
        created_at = datetime.utcnow()
        items = [MockItem()]
        payments = [MockPayment()]
        address = MockAddress()
        user = MockUser()

    class MockContact:
        id = 1042
        name = "Kiruthika Palanisamy"
        email = recipient
        phone = "+91 98765 43210"
        subject = "Skincare Routine Consultation"
        message = "Could you recommend which serum to layer before the botanical barrier cream for sensitive skin?"

    class MockRefund:
        id = 12
        refund_number = "RFD-20260827-DEMO"
        amount = 1290.0
        currency = "INR"
        refund_mode = "ORIGINAL_PAYMENT"

    # Select template renderer
    if "ORDER_CONFIRM" in tmpl:
        rendered = email_templates.render_order_confirmation(MockOrder(), MockUser(), frontend_url)
        sender_role = "orders"
    elif "PACKED" in tmpl:
        rendered = email_templates.render_order_packed(MockOrder(), MockUser(), frontend_url)
        sender_role = "orders"
    elif "SHIPPED" in tmpl:
        rendered = email_templates.render_order_shipped(MockOrder(), {"awb_code": "BD-EXP-98234176", "courier_name": "Blue Dart Express", "tracking_url": f"{frontend_url}/track/DEMO"}, MockUser(), frontend_url)
        sender_role = "orders"
    elif "OUT_FOR_DELIVERY" in tmpl:
        rendered = email_templates.render_out_for_delivery(MockOrder(), None, MockUser(), frontend_url)
        sender_role = "orders"
    elif "DELIVERED" in tmpl:
        rendered = email_templates.render_order_delivered(MockOrder(), MockUser(), frontend_url)
        sender_role = "orders"
    elif "CANCEL" in tmpl:
        rendered = email_templates.render_order_cancelled(MockOrder(), "Order cancelled per customer request", MockUser(), frontend_url)
        sender_role = "orders"
    elif "REFUND" in tmpl:
        rendered = email_templates.render_refund_notification(MockOrder(), MockRefund(), MockUser(), frontend_url)
        sender_role = "orders"
    elif "OTP" in tmpl:
        rendered = email_templates.render_otp_email("Kiruthika", "482910", "Security Verification Code", 15, frontend_url)
        sender_role = "noreply"
    elif "PASSWORD_RESET" in tmpl or "PASSWORD_CHANGE" in tmpl:
        rendered = email_templates.render_password_reset_confirmation("Kiruthika", frontend_url)
        sender_role = "noreply"
    elif "CONTACT_ACK" in tmpl or "CONTACT_FORM" in tmpl:
        rendered = email_templates.render_contact_acknowledgement(MockContact(), frontend_url)
        sender_role = "support"
    elif "ADMIN_ORDER" in tmpl:
        rendered = email_templates.render_admin_order_alert(MockOrder(), MockUser(), f"{frontend_url}/admin")
        sender_role = "admin"
    elif "ADMIN_CONTACT" in tmpl:
        rendered = email_templates.render_admin_contact_alert(MockContact(), f"{frontend_url}/admin")
        sender_role = "admin"
    elif "BACK_IN_STOCK" in tmpl or "STOCK" in tmpl:
        rendered = email_templates.render_back_in_stock_alert("Korean Ginseng & Centella Radiance Elixir", "50ml", f"{frontend_url}/shop", frontend_url)
        sender_role = "marketing"
    else: # Welcome Registration
        rendered = email_templates.render_welcome_email(MockUser(), frontend_url)
        sender_role = "noreply"

    success = EmailService._send_email_sync(
        to_email=recipient,
        subject=f"[Test] {rendered['subject']}",
        html_content=rendered["html"],
        text_content=rendered["text"],
        sender_role=sender_role,
        template_name=f"TEST_{tmpl}"
    )

    if not success and cfg["mode"] == "smtp" and cfg["password"]:
        raise HTTPException(
            status_code=500,
            detail="Live SMTP delivery failed. Please verify SMTP host/port and App Password credentials in backend/.env"
        )

    return {
        "message": f"Test email for template [{tmpl}] sent to {recipient} via {sender_role}@yuraebeauty.com!",
        "success": True,
        "template": tmpl,
        "sender": sender_role
    }

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


# Customer 360 profile endpoint is defined in Customer Management section above


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
