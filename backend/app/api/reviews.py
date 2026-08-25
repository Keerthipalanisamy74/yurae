import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Request
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import Review, Product, Order, OrderItem, User
from app.schemas.schemas import ReviewResponse, ReviewCreate
from app.api.deps import get_current_user, get_current_admin
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter(prefix="", tags=["Reviews"])

class PhotoUploadResponse(BaseModel):
    photo_url: str
    message: str = "Photo uploaded successfully"

@router.get("/products/{product_id}/reviews", response_model=List[ReviewResponse])
def get_product_reviews(product_id: int, db: Session = Depends(get_db)):
    reviews = db.query(Review).filter(
        Review.product_id == product_id,
        Review.is_approved == True
    ).order_by(Review.created_at.desc()).all()

    result = []
    for r in reviews:
        user_name = f"{r.user.first_name} {r.user.last_name[0]}." if r.user else "Verified Customer"
        is_buyer = db.query(OrderItem).join(Order).filter(
            Order.user_id == r.user_id,
            OrderItem.product_id == r.product_id
        ).first() is not None

        result.append({
            "id": r.id,
            "user_id": r.user_id,
            "product_id": r.product_id,
            "rating": r.rating,
            "review": r.review,
            "photo_url": r.photo_url,
            "is_approved": r.is_approved,
            "created_at": r.created_at,
            "user_name": user_name,
            "product_name": r.product.name if r.product else None,
            "product_slug": r.product.slug if r.product else None,
            "is_verified_buyer": is_buyer
        })
    return result

@router.get("/products/{product_id}/review-eligibility")
def check_review_eligibility(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check if user has an order with this product
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

    return {
        "eligible": True,
        "has_purchased": bool(any_purchase),
        "is_delivered": bool(delivered_purchase),
        "has_reviewed": bool(existing_review),
        "existing_review": {
            "rating": existing_review.rating,
            "review": existing_review.review,
            "photo_url": existing_review.photo_url
        } if existing_review else None,
        "message": "You are eligible to share your review for this product."
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

    is_buyer = db.query(OrderItem).join(Order).filter(
        Order.user_id == current_user.id,
        OrderItem.product_id == product_id
    ).first() is not None

    # Check for existing review
    existing = db.query(Review).filter(
        Review.user_id == current_user.id,
        Review.product_id == product_id
    ).first()

    if existing:
        existing.rating = rev_in.rating
        existing.review = rev_in.review
        if rev_in.photo_url is not None:
            existing.photo_url = rev_in.photo_url
        db.commit()
        db.refresh(existing)
        r = existing
    else:
        new_rev = Review(
            user_id=current_user.id,
            product_id=product_id,
            rating=rev_in.rating,
            review=rev_in.review,
            photo_url=rev_in.photo_url,
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
        "photo_url": r.photo_url,
        "is_approved": r.is_approved,
        "created_at": r.created_at,
        "user_name": user_name,
        "product_name": product.name,
        "product_slug": product.slug,
        "is_verified_buyer": is_buyer
    }

class PhotoUploadPayload(BaseModel):
    photo_base64: Optional[str] = None
    photo_url: Optional[str] = None

@router.post("/reviews/upload-photo", response_model=PhotoUploadResponse)
async def upload_review_photo(
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """
    Saves a customer's review photo (glow / look) and returns an accessible URL.
    """
    uploads_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads", "reviews")
    os.makedirs(uploads_dir, exist_ok=True)
    content_type = request.headers.get("content-type", "")

    if "multipart/form-data" in content_type:
        form = await request.form()
        file = form.get("file")
        if file and hasattr(file, "filename") and file.filename:
            ext = os.path.splitext(file.filename)[1].lower() or ".jpg"
            unique_filename = f"glow_{uuid.uuid4().hex[:10]}{ext}"
            target_path = os.path.join(uploads_dir, unique_filename)
            
            contents = await file.read()
            with open(target_path, "wb") as f:
                f.write(contents)
            
            return {
                "photo_url": f"http://127.0.0.1:8000/uploads/reviews/{unique_filename}",
                "message": "Glow photo uploaded successfully"
            }
    
    try:
        body = await request.json()
        if body and body.get("photo_url"):
            return {
                "photo_url": body["photo_url"],
                "message": "Photo registered successfully"
            }
    except Exception:
        pass

    raise HTTPException(status_code=400, detail="No photo file or valid image URL provided")

@router.get("/reviews/my-reviews", response_model=List[ReviewResponse])
def get_my_reviews(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reviews = db.query(Review).filter(Review.user_id == current_user.id).order_by(Review.created_at.desc()).all()
    result = []
    for r in reviews:
        result.append({
            "id": r.id,
            "user_id": r.user_id,
            "product_id": r.product_id,
            "rating": r.rating,
            "review": r.review,
            "photo_url": r.photo_url,
            "is_approved": r.is_approved,
            "created_at": r.created_at,
            "user_name": f"{current_user.first_name} {current_user.last_name}",
            "product_name": r.product.name if r.product else None,
            "product_slug": r.product.slug if r.product else None
        })
    return result

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
            "photo_url": r.photo_url,
            "is_approved": r.is_approved,
            "created_at": r.created_at,
            "user_name": user_name,
            "product_name": r.product.name if r.product else None,
            "product_slug": r.product.slug if r.product else None
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
