from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import Category, User
from app.schemas.schemas import CategoryResponse, CategoryCreate
from app.api.deps import get_current_admin
from typing import List

router = APIRouter(prefix="/categories", tags=["Categories"])

@router.get("", response_model=List[CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    return db.query(Category).all()

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
    existing = db.query(Category).filter(Category.slug == cat_in.slug).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category slug already exists")

    cat = Category(
        name=cat_in.name,
        slug=cat_in.slug.lower(),
        description=cat_in.description,
        image=cat_in.image
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

    cat.name = cat_in.name
    cat.slug = cat_in.slug.lower()
    cat.description = cat_in.description
    if cat_in.image:
        cat.image = cat_in.image

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

    db.delete(cat)
    db.commit()
    return {"message": "Category deleted successfully"}
