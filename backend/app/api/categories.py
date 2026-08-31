from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import Category, User, Product
from app.schemas.schemas import CategoryResponse, CategoryCreate
from app.api.deps import get_current_admin
from typing import List
import re

router = APIRouter(prefix="/categories", tags=["Categories"])

@router.get("", response_model=List[CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    return db.query(Category).order_by(Category.id.asc()).all()

@router.get("/{identifier}", response_model=CategoryResponse)
def get_category(identifier: str, db: Session = Depends(get_db)):
    if identifier.isdigit():
        cat = db.query(Category).filter(Category.id == int(identifier)).first()
    else:
        cat = db.query(Category).filter(Category.slug == identifier.lower()).first()

    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    return cat

@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    cat_in: CategoryCreate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    # Sanitize slug
    raw_slug = cat_in.slug or cat_in.name.lower()
    cleaned_slug = re.sub(r'[^a-zA-Z0-9]+', '-', raw_slug).strip('-').lower()
    if not cleaned_slug:
        cleaned_slug = "category"

    # Ensure unique slug
    base_slug = cleaned_slug
    counter = 1
    while db.query(Category).filter(Category.slug == cleaned_slug).first():
        cleaned_slug = f"{base_slug}-{counter}"
        counter += 1

    cat = Category(
        name=cat_in.name.strip(),
        slug=cleaned_slug,
        description=cat_in.description.strip() if cat_in.description else None,
        image=cat_in.image.strip() if cat_in.image else None
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat

@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: int,
    cat_in: CategoryCreate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")

    raw_slug = cat_in.slug or cat_in.name.lower()
    cleaned_slug = re.sub(r'[^a-zA-Z0-9]+', '-', raw_slug).strip('-').lower()
    
    # Check if slug taken by another category
    existing = db.query(Category).filter(Category.slug == cleaned_slug, Category.id != category_id).first()
    if existing:
        cleaned_slug = f"{cleaned_slug}-{category_id}"

    cat.name = cat_in.name.strip()
    cat.slug = cleaned_slug
    cat.description = cat_in.description.strip() if cat_in.description else None
    if cat_in.image is not None:
        cat.image = cat_in.image.strip() if cat_in.image else None

    db.commit()
    db.refresh(cat)
    return cat

@router.delete("/{category_id}")
def delete_category(
    category_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")

    # Safely reassign products to another category if any exist
    products_count = db.query(Product).filter(Product.category_id == category_id).count()
    if products_count > 0:
        fallback_cat = db.query(Category).filter(Category.id != category_id).order_by(Category.id.asc()).first()
        if fallback_cat:
            db.query(Product).filter(Product.category_id == category_id).update(
                {"category_id": fallback_cat.id}, synchronize_session=False
            )
        else:
            raise HTTPException(
                status_code=400,
                detail="Cannot delete the sole category while products exist in the store."
            )

    db.delete(cat)
    db.commit()
    return {"message": "Category deleted successfully"}

