from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.database.session import get_db
from app.models.models import Coupon, User
from app.schemas.schemas import CouponResponse, CouponCreate, CouponUpdate, CouponApply, CouponApplyResponse
from app.api.deps import get_optional_user
from typing import List, Optional

router = APIRouter(prefix="/coupons", tags=["Coupons"])

@router.post("/apply", response_model=CouponApplyResponse)
def apply_coupon(req: CouponApply, db: Session = Depends(get_db)):
    coupon = db.query(Coupon).filter(Coupon.code == req.code.upper(), Coupon.active == True).first()
    if not coupon:
        return CouponApplyResponse(
            valid=False, code=req.code, discount_type="", discount_value=0.0, discount_amount=0.0,
            message="Invalid or inactive coupon code."
        )

    if coupon.expiry_date and coupon.expiry_date < datetime.utcnow():
        return CouponApplyResponse(
            valid=False, code=req.code, discount_type="", discount_value=0.0, discount_amount=0.0,
            message=f"This coupon expired on {coupon.expiry_date.strftime('%d %b %Y')}."
        )

    if coupon.times_used >= coupon.usage_limit:
        return CouponApplyResponse(
            valid=False, code=req.code, discount_type="", discount_value=0.0, discount_amount=0.0,
            message="Coupon usage limit has been reached."
        )

    if req.subtotal < coupon.minimum_order_amount:
        return CouponApplyResponse(
            valid=False, code=req.code, discount_type="", discount_value=0.0, discount_amount=0.0,
            message=f"Minimum order amount for code {coupon.code} is ₹{coupon.minimum_order_amount:.2f}."
        )

    if coupon.discount_type == "PERCENTAGE":
        discount_amount = (req.subtotal * coupon.discount_value) / 100.0
    else:
        discount_amount = min(coupon.discount_value, req.subtotal)

    return CouponApplyResponse(
        valid=True,
        code=coupon.code,
        discount_type=coupon.discount_type,
        discount_value=coupon.discount_value,
        discount_amount=round(discount_amount, 2),
        message=f"Coupon {coupon.code} applied successfully!"
    )

@router.get("", response_model=List[CouponResponse])
def get_coupons(
    include_inactive: bool = Query(True, description="Include inactive coupons"),
    db: Session = Depends(get_db)
):
    query = db.query(Coupon)
    if not include_inactive:
        query = query.filter(Coupon.active == True)
    return query.order_by(Coupon.id.desc()).all()

@router.post("", response_model=CouponResponse, status_code=status.HTTP_201_CREATED)
def create_coupon(
    c_in: CouponCreate,
    db: Session = Depends(get_db),
    current_admin: Optional[User] = Depends(get_optional_user)
):
    clean_code = c_in.code.strip().upper()
    existing = db.query(Coupon).filter(Coupon.code == clean_code).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Coupon code '{clean_code}' already exists")

    calculated_expiry = c_in.expiry_date
    if c_in.duration_days is not None:
        if c_in.duration_days > 0:
            calculated_expiry = datetime.utcnow() + timedelta(days=c_in.duration_days)
        elif c_in.duration_days == 0:
            calculated_expiry = None

    coupon = Coupon(
        code=clean_code,
        discount_type=c_in.discount_type,
        discount_value=c_in.discount_value,
        minimum_order_amount=c_in.minimum_order_amount,
        expiry_date=calculated_expiry,
        usage_limit=c_in.usage_limit,
        times_used=0,
        active=c_in.active
    )
    db.add(coupon)
    db.commit()
    db.refresh(coupon)
    return coupon

@router.put("/{coupon_id}", response_model=CouponResponse)
def update_coupon(
    coupon_id: int,
    c_in: CouponUpdate,
    db: Session = Depends(get_db),
    current_admin: Optional[User] = Depends(get_optional_user)
):
    coupon = db.query(Coupon).filter(Coupon.id == coupon_id).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")

    if c_in.code is not None:
        clean_code = c_in.code.strip().upper()
        existing = db.query(Coupon).filter(Coupon.code == clean_code, Coupon.id != coupon_id).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"Another coupon with code '{clean_code}' already exists")
        coupon.code = clean_code

    if c_in.discount_type is not None:
        coupon.discount_type = c_in.discount_type
    if c_in.discount_value is not None:
        coupon.discount_value = c_in.discount_value
    if c_in.minimum_order_amount is not None:
        coupon.minimum_order_amount = c_in.minimum_order_amount

    # Handle duration_days vs explicit expiry_date
    if c_in.duration_days is not None:
        if c_in.duration_days > 0:
            coupon.expiry_date = datetime.utcnow() + timedelta(days=c_in.duration_days)
        elif c_in.duration_days <= 0:
            coupon.expiry_date = None
    elif c_in.expiry_date is not None:
        coupon.expiry_date = c_in.expiry_date

    if c_in.usage_limit is not None:
        coupon.usage_limit = c_in.usage_limit
    if c_in.active is not None:
        coupon.active = c_in.active

    db.commit()
    db.refresh(coupon)
    return coupon

@router.delete("/{coupon_id}")
def delete_coupon(
    coupon_id: int,
    db: Session = Depends(get_db),
    current_admin: Optional[User] = Depends(get_optional_user)
):
    c = db.query(Coupon).filter(Coupon.id == coupon_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Coupon not found")
    code = c.code
    db.delete(c)
    db.commit()
    return {"message": f"Coupon '{code}' deleted successfully"}
