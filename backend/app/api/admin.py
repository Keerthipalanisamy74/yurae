from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.session import get_db
from app.models.models import Order, User, Product, Category
from app.schemas.schemas import AdminDashboardStats, OrderResponse, UserResponse
from app.api.deps import get_current_admin
from typing import List, Optional

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
