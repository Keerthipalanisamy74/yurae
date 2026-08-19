from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from app.database.session import get_db
from app.models.models import Coupon, User
from app.schemas.schemas import CouponResponse, CouponCreate, CouponApply, CouponApplyResponse
from app.api.deps import get_current_admin
from typing import List

router = APIRouter(prefix="/coupons", tags=["Coupons"])

@router.post("/apply", response_model=CouponApplyResponse)
def apply_coupon(req: CouponApply, db: Session = Depends(get_db)):
    coupon = db.query(Coupon).filter(Coupon.code == req.code.upper(), Coupon.active == True).first()
    if not coupon:
        return CouponApplyResponse(
            valid=False, code=req.code, discount_type="", discount_value=0.0, discount_amount=0.0,
            message="Invalid or expired coupon code."
        )

    if coupon.expiry_date and coupon.expiry_date < datetime.utcnow():
        return CouponApplyResponse(
            valid=False, code=req.code, discount_type="", discount_value=0.0, discount_amount=0.0,
            message="This coupon has expired."
        )

    if coupon.times_used >= coupon.usage_limit:
        return CouponApplyResponse(
            valid=False, code=req.code, discount_type="", discount_value=0.0, discount_amount=0.0,
            message="Coupon usage limit reached."
        )

    if req.subtotal < coupon.minimum_order_amount:
        return CouponApplyResponse(
            valid=False, code=req.code, discount_type="", discount_value=0.0, discount_amount=0.0,
            message=f"Minimum order amount for this coupon is ₹{coupon.minimum_order_amount:.2f}."
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
        message="Coupon applied successfully!"
    )

@router.get("", response_model=List[CouponResponse])
def get_coupons(db: Session = Depends(get_db)):
    return db.query(Coupon).filter(Coupon.active == True).all()

@router.post("", response_model=CouponResponse, status_code=status.HTTP_201_CREATED)
def create_coupon(
    c_in: CouponCreate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    existing = db.query(Coupon).filter(Coupon.code == c_in.code.upper()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Coupon code already exists")

    coupon = Coupon(
        code=c_in.code.upper(),
        discount_type=c_in.discount_type,
        discount_value=c_in.discount_value,
        minimum_order_amount=c_in.minimum_order_amount,
        expiry_date=c_in.expiry_date,
        usage_limit=c_in.usage_limit,
        active=c_in.active
    )
    db.add(coupon)
    db.commit()
    db.refresh(coupon)
    return coupon

@router.delete("/{coupon_id}")
def delete_coupon(
    coupon_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    c = db.query(Coupon).filter(Coupon.id == coupon_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Coupon not found")
    db.delete(c)
    db.commit()
    return {"message": "Coupon deleted"}
