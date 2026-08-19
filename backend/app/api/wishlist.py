from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import Wishlist, Product, User
from app.schemas.schemas import WishlistResponse, WishlistAdd
from app.api.deps import get_current_user
from app.api.products import format_product_response
from typing import List

router = APIRouter(prefix="/wishlist", tags=["Wishlist"])

@router.get("", response_model=List[WishlistResponse])
def get_wishlist(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    items = db.query(Wishlist).filter(Wishlist.user_id == current_user.id).all()
    result = []
    for item in items:
        prod_dict = format_product_response(item.product, db)
        result.append({
            "id": item.id,
            "user_id": item.user_id,
            "product_id": item.product_id,
            "created_at": item.created_at,
            "product": prod_dict
        })
    return result

@router.post("", response_model=WishlistResponse, status_code=status.HTTP_201_CREATED)
def add_to_wishlist(
    item_in: WishlistAdd,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == item_in.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    existing = db.query(Wishlist).filter(
        Wishlist.user_id == current_user.id,
        Wishlist.product_id == item_in.product_id
    ).first()

    if existing:
        prod_dict = format_product_response(product, db)
        return {
            "id": existing.id,
            "user_id": existing.user_id,
            "product_id": existing.product_id,
            "created_at": existing.created_at,
            "product": prod_dict
        }

    new_item = Wishlist(user_id=current_user.id, product_id=item_in.product_id)
    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    prod_dict = format_product_response(product, db)
    return {
        "id": new_item.id,
        "user_id": new_item.user_id,
        "product_id": new_item.product_id,
        "created_at": new_item.created_at,
        "product": prod_dict
    }

@router.delete("/{product_id}")
def remove_from_wishlist(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(Wishlist).filter(
        Wishlist.user_id == current_user.id,
        Wishlist.product_id == product_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found in wishlist")

    db.delete(item)
    db.commit()
    return {"message": "Product removed from wishlist"}
