from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import Review, Product, Order, OrderItem, User
from app.schemas.schemas import ReviewResponse, ReviewCreate
from app.api.deps import get_current_user, get_current_admin
from typing import List

router = APIRouter(prefix="", tags=["Reviews"])

@router.get("/products/{product_id}/reviews", response_model=List[ReviewResponse])
def get_product_reviews(product_id: int, db: Session = Depends(get_db)):
    reviews = db.query(Review).filter(
        Review.product_id == product_id,
        Review.is_approved == True
    ).order_by(Review.created_at.desc()).all()

    result = []
    for r in reviews:
        user_name = f"{r.user.first_name} {r.user.last_name[0]}." if r.user else "Verified Customer"
        result.append({
            "id": r.id,
            "user_id": r.user_id,
            "product_id": r.product_id,
            "rating": r.rating,
            "review": r.review,
            "is_approved": r.is_approved,
            "created_at": r.created_at,
            "user_name": user_name
        })
    return result

@router.get("/products/{product_id}/review-eligibility")
def check_review_eligibility(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    delivered_purchase = db.query(OrderItem).join(Order).filter(
        Order.user_id == current_user.id,
        OrderItem.product_id == product_id,
        Order.order_status.in_(["Delivered", "delivered", "DELIVERED"])
    ).first()

    any_purchase = db.query(OrderItem).join(Order).filter(
        Order.user_id == current_user.id,
        OrderItem.product_id == product_id
    ).first()

    existing_review = db.query(Review).filter(
        Review.user_id == current_user.id,
        Review.product_id == product_id
    ).first()

    if delivered_purchase:
        return {
            "eligible": True,
            "has_purchased": True,
            "is_delivered": True,
            "has_reviewed": bool(existing_review),
            "existing_review": {
                "rating": existing_review.rating,
                "review": existing_review.review
            } if existing_review else None,
            "message": "You are eligible to review this delivered item."
        }
    elif any_purchase:
        return {
            "eligible": False,
            "has_purchased": True,
            "is_delivered": False,
            "has_reviewed": False,
            "existing_review": None,
            "message": "Reviews can be submitted once your order has been delivered."
        }
    else:
        return {
            "eligible": False,
            "has_purchased": False,
            "is_delivered": False,
            "has_reviewed": False,
            "existing_review": None,
            "message": "Only verified buyers who received this item can submit a review."
        }

@router.post("/products/{product_id}/reviews", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def create_review(
    product_id: int,
    rev_in: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Verify if user has purchased and received the product (Delivered)
    delivered_purchase = db.query(OrderItem).join(Order).filter(
        Order.user_id == current_user.id,
        OrderItem.product_id == product_id,
        Order.order_status.in_(["Delivered", "delivered", "DELIVERED"])
    ).first()

    if not delivered_purchase:
        any_purchase = db.query(OrderItem).join(Order).filter(
            Order.user_id == current_user.id,
            OrderItem.product_id == product_id
        ).first()
        if any_purchase:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reviews can only be submitted once your order has been delivered."
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only customers who have purchased and received this product can submit a review."
            )

    # Check for existing review
    existing = db.query(Review).filter(
        Review.user_id == current_user.id,
        Review.product_id == product_id
    ).first()

    if existing:
        existing.rating = rev_in.rating
        existing.review = rev_in.review
        db.commit()
        db.refresh(existing)
        r = existing
    else:
        new_rev = Review(
            user_id=current_user.id,
            product_id=product_id,
            rating=rev_in.rating,
            review=rev_in.review,
            is_approved=True
        )
        db.add(new_rev)
        db.commit()
        db.refresh(new_rev)
        r = new_rev

    user_name = f"{current_user.first_name} {current_user.last_name[0]}."
    return {
        "id": r.id,
        "user_id": r.user_id,
        "product_id": r.product_id,
        "rating": r.rating,
        "review": r.review,
        "is_approved": r.is_approved,
        "created_at": r.created_at,
        "user_name": user_name
    }

# Admin moderation
@router.get("/admin/reviews", response_model=List[ReviewResponse])
def get_all_reviews_admin(current_admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    reviews = db.query(Review).order_by(Review.created_at.desc()).all()
    result = []
    for r in reviews:
        user_name = f"{r.user.first_name} {r.user.last_name}" if r.user else "User"
        result.append({
            "id": r.id,
            "user_id": r.user_id,
            "product_id": r.product_id,
            "rating": r.rating,
            "review": r.review,
            "is_approved": r.is_approved,
            "created_at": r.created_at,
            "user_name": user_name
        })
    return result

@router.put("/admin/reviews/{review_id}/toggle-approval")
def toggle_review_approval(
    review_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    rev = db.query(Review).filter(Review.id == review_id).first()
    if not rev:
        raise HTTPException(status_code=404, detail="Review not found")
    rev.is_approved = not rev.is_approved
    db.commit()
    return {"message": "Review approval toggled", "is_approved": rev.is_approved}
