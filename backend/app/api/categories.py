from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.session import get_db
from app.models.models import Category, Subcategory, User, Product
from app.schemas.schemas import (
    CategoryResponse,
    CategoryCreate,
    SubcategoryResponse,
    SubcategoryCreate,
    SubcategoryUpdate,
)
from app.api.deps import get_current_admin
from typing import List, Optional
import re

router = APIRouter(prefix="/categories", tags=["Categories"])

def format_subcategory_response(sub: Subcategory, db: Session, include_children: bool = True) -> dict:
    prod_count = db.query(func.count(Product.id)).filter(Product.subcategory_id == sub.id).scalar() or 0
    children_formatted = []
    if include_children:
        children = db.query(Subcategory).filter(Subcategory.parent_id == sub.id).order_by(Subcategory.display_order.asc(), Subcategory.id.asc()).all()
        children_formatted = [format_subcategory_response(c, db, include_children=False) for c in children]

    return {
        "id": sub.id,
        "category_id": sub.category_id,
        "parent_id": sub.parent_id,
        "name": sub.name,
        "slug": sub.slug,
        "description": sub.description,
        "image": sub.image,
        "display_order": sub.display_order or 0,
        "created_at": sub.created_at,
        "product_count": prod_count,
        "children": children_formatted,
    }

def format_category_response(cat: Category, db: Session) -> dict:
    prod_count = db.query(func.count(Product.id)).filter(Product.category_id == cat.id).scalar() or 0
    # Return top-level subcategories (parent groups), with their nested children inside
    subcategories = db.query(Subcategory).filter(
        Subcategory.category_id == cat.id,
        Subcategory.parent_id == None
    ).order_by(Subcategory.display_order.asc(), Subcategory.id.asc()).all()
    formatted_subs = [format_subcategory_response(s, db, include_children=True) for s in subcategories]
    
    return {
        "id": cat.id,
        "name": cat.name,
        "slug": cat.slug,
        "description": cat.description,
        "image": cat.image,
        "created_at": cat.created_at,
        "product_count": prod_count,
        "subcategories": formatted_subs,
    }

@router.get("", response_model=List[CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    categories = db.query(Category).order_by(Category.id.asc()).all()
    return [format_category_response(c, db) for c in categories]

# Global subcategories endpoint (also accessible via /categories/subcategories/all)
@router.get("/subcategories/all", response_model=List[SubcategoryResponse])
def get_all_subcategories(
    category_id: Optional[int] = None,
    category_slug: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Subcategory)
    if category_id:
        query = query.filter(Subcategory.category_id == category_id)
    elif category_slug:
        cat = db.query(Category).filter(Category.slug == category_slug).first()
        if cat:
            query = query.filter(Subcategory.category_id == cat.id)
        else:
            return []
    
    subs = query.order_by(Subcategory.display_order.asc(), Subcategory.id.asc()).all()
    return [format_subcategory_response(s, db) for s in subs]

@router.get("/{identifier}", response_model=CategoryResponse)
def get_category(identifier: str, db: Session = Depends(get_db)):
    if identifier.isdigit():
        cat = db.query(Category).filter(Category.id == int(identifier)).first()
    else:
        cat = db.query(Category).filter(Category.slug == identifier.lower()).first()

    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    return format_category_response(cat, db)

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
    return format_category_response(cat, db)

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
    return format_category_response(cat, db)

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
                {"category_id": fallback_cat.id, "subcategory_id": None}, synchronize_session=False
            )
        else:
            raise HTTPException(
                status_code=400,
                detail="Cannot delete the sole category while products exist in the store."
            )

    db.delete(cat)
    db.commit()
    return {"message": "Category deleted successfully"}


# ==========================================
# SUBCATEGORIES MANAGEMENT ENDPOINTS
# ==========================================

@router.get("/{category_id}/subcategories", response_model=List[SubcategoryResponse])
def get_subcategories_by_category(
    category_id: int,
    db: Session = Depends(get_db)
):
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")

    subs = db.query(Subcategory).filter(Subcategory.category_id == category_id).order_by(Subcategory.display_order.asc(), Subcategory.id.asc()).all()
    return [format_subcategory_response(s, db) for s in subs]

@router.post("/{category_id}/subcategories", response_model=SubcategoryResponse, status_code=status.HTTP_201_CREATED)
def create_subcategory(
    category_id: int,
    sub_in: SubcategoryCreate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")

    # Sanitize slug
    raw_slug = sub_in.slug or sub_in.name.lower()
    cleaned_slug = re.sub(r'[^a-zA-Z0-9]+', '-', raw_slug).strip('-').lower()
    if not cleaned_slug:
        cleaned_slug = "subcategory"

    # Ensure unique slug within this category
    base_slug = cleaned_slug
    counter = 1
    while db.query(Subcategory).filter(Subcategory.category_id == category_id, Subcategory.slug == cleaned_slug).first():
        cleaned_slug = f"{base_slug}-{counter}"
        counter += 1

    # Default display_order to highest + 1
    if sub_in.display_order is None or sub_in.display_order == 0:
        max_order = db.query(func.max(Subcategory.display_order)).filter(Subcategory.category_id == category_id).scalar() or 0
        disp_order = max_order + 1
    else:
        disp_order = sub_in.display_order

    new_sub = Subcategory(
        category_id=category_id,
        parent_id=sub_in.parent_id,
        name=sub_in.name.strip(),
        slug=cleaned_slug,
        description=sub_in.description.strip() if sub_in.description else None,
        image=sub_in.image.strip() if sub_in.image else None,
        display_order=disp_order,
    )
    db.add(new_sub)
    db.commit()
    db.refresh(new_sub)
    return format_subcategory_response(new_sub, db)

@router.put("/{category_id}/subcategories/{subcategory_id}", response_model=SubcategoryResponse)
def update_subcategory(
    category_id: int,
    subcategory_id: int,
    sub_in: SubcategoryUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    sub = db.query(Subcategory).filter(Subcategory.id == subcategory_id, Subcategory.category_id == category_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subcategory not found")

    if sub_in.name is not None:
        sub.name = sub_in.name.strip()
        
    if sub_in.slug is not None:
        cleaned_slug = re.sub(r'[^a-zA-Z0-9]+', '-', sub_in.slug.lower()).strip('-')
        if cleaned_slug:
            existing = db.query(Subcategory).filter(
                Subcategory.category_id == category_id,
                Subcategory.slug == cleaned_slug,
                Subcategory.id != subcategory_id
            ).first()
            if existing:
                cleaned_slug = f"{cleaned_slug}-{subcategory_id}"
            sub.slug = cleaned_slug

    if sub_in.description is not None:
        sub.description = sub_in.description.strip() if sub_in.description else None

    if sub_in.image is not None:
        sub.image = sub_in.image.strip() if sub_in.image else None

    if sub_in.display_order is not None:
        sub.display_order = sub_in.display_order

    if sub_in.parent_id is not None:
        sub.parent_id = sub_in.parent_id if sub_in.parent_id > 0 else None

    if sub_in.category_id is not None and sub_in.category_id != category_id:
        target_cat = db.query(Category).filter(Category.id == sub_in.category_id).first()
        if not target_cat:
            raise HTTPException(status_code=400, detail="Target category does not exist")
        sub.category_id = target_cat.id

    db.commit()
    db.refresh(sub)
    return format_subcategory_response(sub, db)

@router.delete("/{category_id}/subcategories/{subcategory_id}")
def delete_subcategory(
    category_id: int,
    subcategory_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    sub = db.query(Subcategory).filter(Subcategory.id == subcategory_id, Subcategory.category_id == category_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subcategory not found")

    # Unlink products assigned to this subcategory safely
    db.query(Product).filter(Product.subcategory_id == subcategory_id).update(
        {"subcategory_id": None}, synchronize_session=False
    )

    db.delete(sub)
    db.commit()
    return {"message": "Subcategory deleted successfully and associated products unlinked"}
