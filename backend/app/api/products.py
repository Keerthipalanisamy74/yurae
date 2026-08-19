import uuid
import re
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from app.database.session import get_db
from app.models.models import Product, ProductImage, ProductVariant, Category, Review, User, CartItem, Wishlist, OrderItem
from app.schemas.schemas import ProductResponse, ProductCreate, ProductUpdate
from app.api.deps import get_current_admin
from typing import List, Optional

router = APIRouter(prefix="/products", tags=["Products"])

def generate_unique_slug(base_name_or_slug: str, db: Session, current_id: Optional[int] = None) -> str:
    cleaned = re.sub(r'[^a-z0-9]+', '-', base_name_or_slug.lower()).strip('-')
    if not cleaned:
        cleaned = f"prod-{uuid.uuid4().hex[:6]}"
    
    unique_slug = cleaned
    query = db.query(Product).filter(Product.slug == unique_slug)
    if current_id:
        query = query.filter(Product.id != current_id)
    
    if query.first():
        unique_slug = f"{cleaned}-{uuid.uuid4().hex[:6]}"
    return unique_slug

def generate_unique_sku(custom_sku: Optional[str], db: Session, current_id: Optional[int] = None) -> str:
    if custom_sku and custom_sku.strip():
        sku = custom_sku.strip().upper()
        query = db.query(Product).filter(Product.sku == sku)
        if current_id:
            query = query.filter(Product.id != current_id)
        if not query.first():
            return sku
    
    # Auto-generate unique SKU
    while True:
        candidate_sku = f"YUR-{uuid.uuid4().hex[:8].upper()}"
        query = db.query(Product).filter(Product.sku == candidate_sku)
        if current_id:
            query = query.filter(Product.id != current_id)
        if not query.first():
            return candidate_sku

def format_product_response(product: Product, db: Session) -> dict:
    # Calculate avg rating and review count
    review_stats = db.query(
        func.avg(Review.rating).label("avg_rating"),
        func.count(Review.id).label("review_count")
    ).filter(Review.product_id == product.id, Review.is_approved == True).first()

    avg_rating = float(review_stats.avg_rating) if review_stats and review_stats.avg_rating else 5.0
    review_count = int(review_stats.review_count) if review_stats and review_stats.review_count else 0

    p_dict = {
        "id": product.id,
        "category_id": product.category_id,
        "name": product.name,
        "slug": product.slug,
        "description": product.description,
        "short_description": product.short_description,
        "price": product.price,
        "sale_price": product.sale_price,
        "stock_quantity": product.stock_quantity,
        "sku": product.sku,
        "brand": product.brand,
        "weight": product.weight,
        "ingredients": product.ingredients,
        "how_to_use": product.how_to_use,
        "skin_type": product.skin_type,
        "status": product.status,
        "featured": product.featured,
        "created_at": product.created_at,
        "updated_at": product.updated_at,
        "category": product.category,
        "images": product.images,
        "variants": product.variants,
        "avg_rating": round(avg_rating, 1),
        "review_count": review_count
    }
    return p_dict

@router.get("", response_model=List[ProductResponse])
def get_products(
    category_slug: Optional[str] = None,
    skin_type: Optional[str] = None,
    search: Optional[str] = None,
    featured: Optional[bool] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sort_by: Optional[str] = "featured", # featured, newest, price_low, price_high, rating, best_selling
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    query = db.query(Product).filter(Product.status == "ACTIVE")

    if category_slug:
        cat = db.query(Category).filter(Category.slug == category_slug.lower()).first()
        if cat:
            query = query.filter(Product.category_id == cat.id)
        else:
            return []

    if skin_type and skin_type != "All":
        query = query.filter(Product.skin_type.ilike(f"%{skin_type}%"))

    if featured is not None:
        query = query.filter(Product.featured == featured)

    if min_price is not None:
        query = query.filter(Product.price >= min_price)

    if max_price is not None:
        query = query.filter(Product.price <= max_price)

    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            or_(
                Product.name.ilike(search_fmt),
                Product.description.ilike(search_fmt),
                Product.brand.ilike(search_fmt),
                Product.sku.ilike(search_fmt),
                Product.ingredients.ilike(search_fmt)
            )
        )

    # Sorting
    if sort_by == "newest":
        query = query.order_by(Product.created_at.desc())
    elif sort_by == "price_low":
        query = query.order_by(Product.price.asc())
    elif sort_by == "price_high":
        query = query.order_by(Product.price.desc())
    else:
        query = query.order_by(Product.featured.desc(), Product.created_at.desc())

    products = query.offset(offset).limit(limit).all()
    return [format_product_response(p, db) for p in products]

@router.get("/{identifier}", response_model=ProductResponse)
def get_product_by_id_or_slug(identifier: str, db: Session = Depends(get_db)):
    if identifier.isdigit():
        product = db.query(Product).filter(Product.id == int(identifier)).first()
    else:
        product = db.query(Product).filter(Product.slug == identifier).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    return format_product_response(product, db)

# Admin operations
@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    prod_in: ProductCreate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    # Automatically generate a unique slug
    base_slug = prod_in.slug or prod_in.name
    final_slug = generate_unique_slug(base_slug, db)

    # Automatically generate a unique SKU
    final_sku = generate_unique_sku(prod_in.sku, db)

    new_prod = Product(
        category_id=prod_in.category_id,
        name=prod_in.name,
        slug=final_slug,
        description=prod_in.description,
        short_description=prod_in.short_description,
        price=prod_in.price,
        sale_price=prod_in.sale_price,
        base_currency=prod_in.base_currency or "INR",
        stock_quantity=prod_in.stock_quantity,
        sku=final_sku,
        brand=prod_in.brand or "Yurae Beauty",
        weight=prod_in.weight,
        ingredients=prod_in.ingredients,
        how_to_use=prod_in.how_to_use,
        skin_type=prod_in.skin_type,
        status=prod_in.status or "ACTIVE",
        featured=prod_in.featured if prod_in.featured is not None else False
    )
    db.add(new_prod)
    db.commit()
    db.refresh(new_prod)

    # Add images if provided
    for idx, img_url in enumerate(prod_in.images):
        img = ProductImage(product_id=new_prod.id, image_url=img_url, sort_order=idx)
        db.add(img)

    # Add variants (e.g. fashion sizes XS, S, M, L, XL, XXL, XXXL) if provided
    if prod_in.variants:
        for v in prod_in.variants:
            variant_obj = ProductVariant(
                product_id=new_prod.id,
                variant_name=v.variant_name or "Size",
                variant_value=v.variant_value,
                additional_price=v.additional_price or 0.0,
                stock_quantity=v.stock_quantity if v.stock_quantity > 0 else new_prod.stock_quantity
            )
            db.add(variant_obj)

    db.commit()
    db.refresh(new_prod)

    return format_product_response(new_prod, db)

@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    prod_in: ProductUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    prod = db.query(Product).filter(Product.id == product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")

    update_data = prod_in.model_dump(exclude_unset=True) if hasattr(prod_in, "model_dump") else prod_in.dict(exclude_unset=True)
    for field, val in update_data.items():
        setattr(prod, field, val)

    db.commit()
    db.refresh(prod)
@router.delete("/clear/all")
def clear_all_products_endpoint(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    # Delete all dependent records first
    db.query(CartItem).delete()
    db.query(Wishlist).delete()
    db.query(Review).delete()
    db.query(OrderItem).delete()
    db.query(ProductVariant).delete()
    db.query(ProductImage).delete()

    num_deleted = db.query(Product).delete()
    db.commit()
    return {"message": f"Successfully deleted all {num_deleted} products from the database."}

@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    prod = db.query(Product).filter(Product.id == product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")

    # Clean up dependent records before deleting
    db.query(CartItem).filter(CartItem.product_id == product_id).delete()
    db.query(Wishlist).filter(Wishlist.product_id == product_id).delete()
    db.query(Review).filter(Review.product_id == product_id).delete()
    db.query(OrderItem).filter(OrderItem.product_id == product_id).delete()
    db.query(ProductVariant).filter(ProductVariant.product_id == product_id).delete()
    db.query(ProductImage).filter(ProductImage.product_id == product_id).delete()

    db.delete(prod)
    db.commit()
    return {"message": f"Product '{prod.name}' deleted successfully"}
