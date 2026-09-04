import uuid
import re
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, text
from app.database.session import get_db
from datetime import datetime
from app.models.models import Product, ProductImage, ProductVariant, Category, Subcategory, Review, User, CartItem, Wishlist, OrderItem, StockNotification
from app.schemas.schemas import ProductResponse, ProductCreate, ProductUpdate, RestockRequest, StockNotificationCreate, StockNotificationResponse
from app.services.email_service import EmailService
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

    # Calculate total units ordered
    order_stats = db.query(
        func.coalesce(func.sum(OrderItem.quantity), 0).label("total_ordered")
    ).filter(OrderItem.product_id == product.id).first()
    total_ordered = int(order_stats.total_ordered) if order_stats and order_stats.total_ordered else 0

    p_dict = {
        "id": product.id,
        "category_id": product.category_id,
        "subcategory_id": product.subcategory_id,
        "subcategory": product.subcategory,
        "name": product.name,
        "slug": product.slug,
        "description": product.description,
        "short_description": product.short_description,
        "price": product.price,
        "sale_price": product.sale_price,
        "base_currency": product.base_currency or "INR",
        "stock_quantity": product.stock_quantity,
        "sku": product.sku,
        "brand": product.brand,
        "weight": product.weight,
        "weight_kg": product.weight_kg if product.weight_kg is not None else 0.35,
        "length_cm": product.length_cm if product.length_cm is not None else 15.0,
        "breadth_cm": product.breadth_cm if product.breadth_cm is not None else 10.0,
        "height_cm": product.height_cm if product.height_cm is not None else 8.0,
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
        "review_count": review_count,
        "total_ordered": total_ordered
    }
    return p_dict

@router.get("", response_model=List[ProductResponse])
def get_products(
    category_slug: Optional[str] = None,
    skin_type: Optional[str] = None,
    subcategory: Optional[str] = None,
    gender: Optional[str] = None,
    tag: Optional[str] = None,
    search: Optional[str] = None,
    featured: Optional[bool] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sort_by: Optional[str] = "featured", # featured, bestsellers, newest, price_low, price_high, rating
    offset: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    query = db.query(Product).filter(Product.status == "ACTIVE")

    # Category filter
    if category_slug and category_slug != "all":
        category = db.query(Category).filter(Category.slug == category_slug).first()
        if category:
            query = query.filter(Product.category_id == category.id)
        else:
            return []

    # Subcategory filter (supports parent group or specific nested subcategory)
    if subcategory and subcategory != "all":
        sub_term = subcategory.strip().lower()
        if sub_term.isdigit():
            target_sub_id = int(sub_term)
            child_sub_ids = [r[0] for r in db.query(Subcategory.id).filter(Subcategory.parent_id == target_sub_id).all()]
            all_target_ids = [target_sub_id] + child_sub_ids
            query = query.filter(Product.subcategory_id.in_(all_target_ids))
        else:
            matching_subs = db.query(Subcategory).filter(
                or_(
                    Subcategory.slug == sub_term,
                    Subcategory.name.ilike(sub_term)
                )
            ).all()
            if matching_subs:
                matching_ids = []
                for ms in matching_subs:
                    matching_ids.append(ms.id)
                    child_sub_ids = [r[0] for r in db.query(Subcategory.id).filter(Subcategory.parent_id == ms.id).all()]
                    matching_ids.extend(child_sub_ids)
                query = query.filter(Product.subcategory_id.in_(list(set(matching_ids))))
            else:
                query = query.join(Product.subcategory).filter(
                    or_(
                        Subcategory.slug == sub_term,
                        Subcategory.name.ilike(sub_term)
                    )
                )

    # Skin type filter (Skincare specific)
    if skin_type and skin_type != "All":
        skin_term = skin_type.strip().lower()
        if skin_term in ["all", "all skin types"]:
            query = query.filter(
                or_(
                    Product.skin_type.ilike("%all%"),
                    Product.skin_type.is_(None),
                    Product.skin_type == ""
                )
            )
        else:
            query = query.filter(
                or_(
                    Product.skin_type.ilike(f"%{skin_term}%"),
                    Product.skin_type.ilike("%all%")
                )
            )

    # Featured filter
    if featured is not None:
        query = query.filter(Product.featured == featured)

    # Price range
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)

    # Search keyword filter (matches name, description, brand, sku, ingredients)
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            or_(
                Product.name.ilike(search_fmt),
                Product.description.ilike(search_fmt),
                Product.short_description.ilike(search_fmt),
                Product.brand.ilike(search_fmt),
                Product.sku.ilike(search_fmt),
                Product.ingredients.ilike(search_fmt)
            )
        )

    # Sorting
    if sort_by in ["bestsellers", "bestseller", "best_selling", "best_seller", "popular"]:
        order_sum_subquery = (
            db.query(
                OrderItem.product_id,
                func.coalesce(func.sum(OrderItem.quantity), 0).label("total_sales")
            )
            .group_by(OrderItem.product_id)
            .subquery()
        )
        query = (
            query.outerjoin(order_sum_subquery, Product.id == order_sum_subquery.c.product_id)
            .order_by(
                func.coalesce(order_sum_subquery.c.total_sales, 0).desc(),
                Product.featured.desc(),
                Product.created_at.desc(),
                Product.id.desc()
            )
        )
    elif sort_by in ["newest", "new_arrivals", "latest", "recent"]:
        query = query.order_by(Product.created_at.desc(), Product.id.desc())
    elif sort_by == "price_low":
        query = query.order_by(Product.price.asc(), Product.id.desc())
    elif sort_by == "price_high":
        query = query.order_by(Product.price.desc(), Product.id.desc())
    elif sort_by == "rating":
        rating_subquery = (
            db.query(
                Review.product_id,
                func.avg(Review.rating).label("avg_rating")
            )
            .filter(Review.is_approved == True)
            .group_by(Review.product_id)
            .subquery()
        )
        query = (
            query.outerjoin(rating_subquery, Product.id == rating_subquery.c.product_id)
            .order_by(func.coalesce(rating_subquery.c.avg_rating, 0).desc(), Product.created_at.desc())
        )
    else:
        query = query.order_by(Product.featured.desc(), Product.created_at.desc(), Product.id.desc())

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

@router.get("/{identifier}/complementary", response_model=List[ProductResponse])
def get_complementary_products(
    identifier: str,
    limit: int = 4,
    db: Session = Depends(get_db)
):
    if identifier.isdigit():
        current_prod = db.query(Product).filter(Product.id == int(identifier)).first()
    else:
        current_prod = db.query(Product).filter(Product.slug == identifier).first()

    if not current_prod:
        raise HTTPException(status_code=404, detail="Product not found")

    cat_slug = current_prod.category.slug.lower() if current_prod.category and current_prod.category.slug else ""
    cat_name = current_prod.category.name.lower() if current_prod.category and current_prod.category.name else ""
    name_lower = current_prod.name.lower()

    is_skincare = "skincare" in cat_slug or "skincare" in cat_name
    is_fashion = "fashion" in cat_slug or "fashion" in cat_name or any(k in name_lower for k in ["dress", "kurti", "skirt", "top", "saree", "apparel"])
    is_accessories = "accessories" in cat_slug or "accessories" in cat_name or any(k in name_lower for k in ["ring", "chain", "necklace", "earring", "jewelry", "bag", "pendant"])

    complementary_ids = []
    
    # 1. Fashion Product -> Primary pairing: Accessories & Jewelry, then other fashion pieces
    if is_fashion:
        accessories_prods = db.query(Product).join(Category).filter(
            Product.id != current_prod.id,
            or_(
                Category.slug.ilike("%accessories%"),
                Category.name.ilike("%accessories%"),
                Product.name.ilike("%ring%"),
                Product.name.ilike("%chain%"),
                Product.name.ilike("%necklace%"),
                Product.name.ilike("%earring%"),
                Product.name.ilike("%bag%")
            )
        ).all()
        for p in accessories_prods:
            if p.id not in complementary_ids and len(complementary_ids) < limit:
                complementary_ids.append(p.id)
        
        if len(complementary_ids) < limit:
            other_fashion = db.query(Product).join(Category).filter(
                Product.id != current_prod.id,
                Product.id.notin_(complementary_ids),
                or_(Category.slug.ilike("%fashion%"), Category.name.ilike("%fashion%"))
            ).all()
            for p in other_fashion:
                if len(complementary_ids) < limit:
                    complementary_ids.append(p.id)

    # 2. Accessories Product -> Primary pairing: Fashion apparel & dresses, then other accessories
    elif is_accessories:
        fashion_prods = db.query(Product).join(Category).filter(
            Product.id != current_prod.id,
            or_(
                Category.slug.ilike("%fashion%"),
                Category.name.ilike("%fashion%"),
                Product.name.ilike("%dress%"),
                Product.name.ilike("%kurti%"),
                Product.name.ilike("%top%"),
                Product.name.ilike("%silk%"),
                Product.name.ilike("%skirt%")
            )
        ).all()
        for p in fashion_prods:
            if p.id not in complementary_ids and len(complementary_ids) < limit:
                complementary_ids.append(p.id)

        if len(complementary_ids) < limit:
            other_acc = db.query(Product).join(Category).filter(
                Product.id != current_prod.id,
                Product.id.notin_(complementary_ids),
                or_(Category.slug.ilike("%accessories%"), Category.name.ilike("%accessories%"))
            ).all()
            for p in other_acc:
                if len(complementary_ids) < limit:
                    complementary_ids.append(p.id)

    # 3. Skincare Product -> Primary pairing: Matching routine steps (Cleanser <-> Serum <-> Toner <-> Balm <-> Cream)
    elif is_skincare:
        if any(k in name_lower for k in ["wash", "cleanse", "cleanser", "soap"]):
            priority_keywords = ["serum", "niacinamide", "arbutin", "balm", "toner", "cream", "moisturizer", "oil"]
        elif any(k in name_lower for k in ["serum", "arbutin", "niacinamide", "vitamin", "retinol"]):
            priority_keywords = ["wash", "cleanse", "balm", "toner", "cream", "moisturizer"]
        elif any(k in name_lower for k in ["balm", "lip"]):
            priority_keywords = ["serum", "wash", "cleanse", "toner", "cream"]
        else:
            priority_keywords = ["serum", "wash", "balm", "toner"]

        for kw in priority_keywords:
            matching = db.query(Product).filter(
                Product.id != current_prod.id,
                Product.id.notin_(complementary_ids) if complementary_ids else True,
                or_(Product.name.ilike(f"%{kw}%"), Product.description.ilike(f"%{kw}%"))
            ).all()
            for p in matching:
                if p.id not in complementary_ids and len(complementary_ids) < limit:
                    complementary_ids.append(p.id)
            if len(complementary_ids) >= limit:
                break

        if len(complementary_ids) < limit:
            remaining_skin = db.query(Product).join(Category).filter(
                Product.id != current_prod.id,
                Product.id.notin_(complementary_ids) if complementary_ids else True,
                or_(Category.slug.ilike("%skincare%"), Category.name.ilike("%skincare%"))
            ).all()
            for p in remaining_skin:
                if len(complementary_ids) < limit:
                    complementary_ids.append(p.id)

    # 4. Fallback guarantee: fill up to 4 items from top-rated/featured products in store
    if len(complementary_ids) < limit:
        fillers = db.query(Product).filter(
            Product.id != current_prod.id,
            Product.id.notin_(complementary_ids) if complementary_ids else True
        ).order_by(Product.featured.desc(), Product.id.desc()).limit(limit - len(complementary_ids)).all()
        for p in fillers:
            complementary_ids.append(p.id)

    if not complementary_ids:
        return []

    found_products = db.query(Product).filter(Product.id.in_(complementary_ids)).all()
    prod_map = {p.id: p for p in found_products}
    ordered_prods = [prod_map[pid] for pid in complementary_ids if pid in prod_map]

    return [format_product_response(p, db) for p in ordered_prods]

# Admin operations
@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    prod_in: ProductCreate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    # Verify or fallback category
    cat = db.query(Category).filter(Category.id == prod_in.category_id).first()
    if not cat:
        cat = db.query(Category).first()
        if not cat:
            cat = Category(name="Botanical Skincare", slug="skincare")
            db.add(cat)
            db.commit()
            db.refresh(cat)
        cat_id = cat.id
    else:
        cat_id = prod_in.category_id

    # Automatically generate a unique slug
    base_slug = prod_in.slug or prod_in.name
    final_slug = generate_unique_slug(base_slug, db)

    # Automatically generate a unique SKU
    final_sku = generate_unique_sku(prod_in.sku, db)

    new_prod = Product(
        category_id=cat_id,
        subcategory_id=prod_in.subcategory_id,
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
        weight_kg=prod_in.weight_kg if prod_in.weight_kg is not None else 0.35,
        length_cm=prod_in.length_cm if prod_in.length_cm is not None else 15.0,
        breadth_cm=prod_in.breadth_cm if prod_in.breadth_cm is not None else 10.0,
        height_cm=prod_in.height_cm if prod_in.height_cm is not None else 8.0,
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
    if prod_in.images:
        for idx, img_url in enumerate(prod_in.images):
            if img_url and str(img_url).strip():
                img = ProductImage(product_id=new_prod.id, image_url=str(img_url).strip(), sort_order=idx)
                db.add(img)

    # Add variants (e.g. fashion sizes XS, S, M, L, XL, XXL, XXXL) if provided
    if prod_in.variants:
        for v in prod_in.variants:
            if v.variant_value and str(v.variant_value).strip():
                var_stock = int(v.stock_quantity) if v.stock_quantity is not None else int(new_prod.stock_quantity)
                variant_obj = ProductVariant(
                    product_id=new_prod.id,
                    variant_name=v.variant_name or "Size",
                    variant_value=str(v.variant_value).strip(),
                    additional_price=float(v.additional_price or 0.0),
                    stock_quantity=var_stock
                )
                db.add(variant_obj)

    db.commit()
    db.expire_all()
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

    try:
        # Handle images update
        if "images" in update_data:
            images_list = update_data.pop("images")
            if images_list is not None:
                db.query(ProductImage).filter(ProductImage.product_id == product_id).delete()
                for idx, img_url in enumerate(images_list):
                    if img_url and str(img_url).strip():
                        img = ProductImage(product_id=prod.id, image_url=str(img_url).strip(), sort_order=idx)
                        db.add(img)

        # Handle variants update with in-place synchronization to prevent foreign key errors
        if "variants" in update_data:
            variants_list = update_data.pop("variants")
            if variants_list is not None:
                existing_variants = db.query(ProductVariant).filter(ProductVariant.product_id == product_id).all()
                existing_map = {v.variant_value.strip().lower(): v for v in existing_variants}
                kept_ids = set()

                for v in variants_list:
                    v_dict = v if isinstance(v, dict) else (v.model_dump() if hasattr(v, "model_dump") else v.dict())
                    val_raw = v_dict.get("variant_value")
                    if val_raw and str(val_raw).strip():
                        val_str = str(val_raw).strip()
                        var_name = v_dict.get("variant_name") or "Size"
                        add_price = float(v_dict.get("additional_price") or 0.0)
                        var_stock = int(v_dict.get("stock_quantity")) if v_dict.get("stock_quantity") is not None else int(prod.stock_quantity)

                        if val_str.lower() in existing_map:
                            var_obj = existing_map[val_str.lower()]
                            var_obj.variant_name = var_name
                            var_obj.variant_value = val_str
                            var_obj.additional_price = add_price
                            var_obj.stock_quantity = var_stock
                            kept_ids.add(var_obj.id)
                        else:
                            new_var = ProductVariant(
                                product_id=prod.id,
                                variant_name=var_name,
                                variant_value=val_str,
                                additional_price=add_price,
                                stock_quantity=var_stock
                            )
                            db.add(new_var)
                            db.flush()
                            kept_ids.add(new_var.id)

                # For removed variants, clean up dependent records safely
                for old_v in existing_variants:
                    if old_v.id not in kept_ids:
                        db.execute(text("DELETE FROM cart_items WHERE variant_id = :vid"), {"vid": old_v.id})
                        db.execute(text("DELETE FROM stock_notifications WHERE variant_id = :vid"), {"vid": old_v.id})
                        db.delete(old_v)

        # Regenerate slug if name changed and slug not given
        if "name" in update_data and update_data["name"] and "slug" not in update_data:
            update_data["slug"] = generate_unique_slug(update_data["name"], db, current_id=prod.id)

        for field, val in update_data.items():
            setattr(prod, field, val)

        db.commit()
        db.expire_all()
        db.refresh(prod)

        # If stock is positive, notify pending subscribers
        if prod.stock_quantity > 0:
            dispatch_pending_restock_notifications(product_id, None, db)

        return format_product_response(prod, db)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update product: {str(e)}"
        )

def dispatch_pending_restock_notifications(product_id: int, variant_id: Optional[int], db: Session):
    prod = db.query(Product).filter(Product.id == product_id).first()
    if not prod:
        return

    query = db.query(StockNotification).filter(
        StockNotification.product_id == product_id,
        StockNotification.is_notified == False
    )
    if variant_id:
        query = query.filter(StockNotification.variant_id == variant_id)

    pending_subs = query.all()
    for sub in pending_subs:
        try:
            EmailService.send_back_in_stock_email(
                to_email=sub.email,
                product_name=prod.name,
                variant_value=sub.variant_value,
                product_url=f"http://localhost:5173/product/{prod.slug}"
            )
            sub.is_notified = True
            sub.notified_at = datetime.utcnow()
        except Exception as e:
            print(f"[RESTOCK ALERT ERROR] Failed notifying {sub.email}: {e}")
    db.commit()

@router.post("/{product_id}/notify-stock")
def subscribe_stock_notification(
    product_id: int,
    req: StockNotificationCreate,
    db: Session = Depends(get_db)
):
    prod = db.query(Product).filter(Product.id == product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")

    variant = None
    if req.variant_id:
        variant = db.query(ProductVariant).filter(
            ProductVariant.id == req.variant_id,
            ProductVariant.product_id == product_id
        ).first()

    var_val = variant.variant_value if variant else req.variant_value

    # Check for existing subscriber
    existing = db.query(StockNotification).filter(
        StockNotification.product_id == product_id,
        StockNotification.email == req.email,
        StockNotification.variant_id == (variant.id if variant else None),
        StockNotification.is_notified == False
    ).first()

    if not existing:
        sub = StockNotification(
            product_id=product_id,
            variant_id=variant.id if variant else None,
            email=req.email,
            variant_name="Size" if var_val else None,
            variant_value=var_val,
            is_notified=False
        )
        db.add(sub)
        db.commit()
        db.refresh(sub)
        try:
            EmailService.send_stock_notification_registered_email(req.email, prod.name, var_val)
        except Exception as e:
            print("[RESTOCK CONFIRM ERROR]:", e)

    size_text = f" ({var_val})" if var_val else ""
    return {
        "success": True,
        "message": f"You're on the priority restock list! We will email {req.email} the moment {prod.name}{size_text} is available."
    }

@router.post("/{product_id}/restock", response_model=ProductResponse)
def restock_product(
    product_id: int,
    req: RestockRequest,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    prod = db.query(Product).filter(Product.id == product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")

    if req.variant_id:
        v = db.query(ProductVariant).filter(ProductVariant.id == req.variant_id, ProductVariant.product_id == product_id).first()
        if v:
            v.stock_quantity = max(0, (v.stock_quantity or 0) + req.add_quantity)
            prod.stock_quantity = sum((var.stock_quantity or 0) for var in prod.variants)
        else:
            raise HTTPException(status_code=404, detail="Variant not found")
    else:
        prod.stock_quantity = max(0, (prod.stock_quantity or 0) + req.add_quantity)
        if prod.variants:
            add_per_var = max(1, req.add_quantity // len(prod.variants))
            for var in prod.variants:
                var.stock_quantity = (var.stock_quantity or 0) + add_per_var
            prod.stock_quantity = sum((var.stock_quantity or 0) for var in prod.variants)

    db.commit()
    db.expire_all()
    db.refresh(prod)

    # Trigger automatic dispatch to waiting customers
    dispatch_pending_restock_notifications(product_id, req.variant_id, db)

    return format_product_response(prod, db)

@router.delete("/clear/all")
def clear_all_products_endpoint(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    try:
        # Delete all dependent records in child-to-parent order
        db.execute(text("DELETE FROM pick_list_items"))
        db.execute(text("DELETE FROM product_inventory_locations"))
        db.execute(text("DELETE FROM stock_notifications"))
        db.execute(text("DELETE FROM cart_items"))
        db.execute(text("DELETE FROM wishlists"))
        db.execute(text("DELETE FROM reviews"))
        db.execute(text("DELETE FROM order_items"))
        db.execute(text("DELETE FROM product_variants"))
        db.execute(text("DELETE FROM product_images"))

        num_deleted = db.query(Product).delete()
        db.commit()
        return {"message": f"Successfully deleted all {num_deleted} products from the database."}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to clear products: {str(e)}"
        )

@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    prod = db.query(Product).filter(Product.id == product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")

    try:
        # Clean up dependent records in child-to-parent order to satisfy foreign keys
        db.execute(
            text("DELETE FROM pick_list_items WHERE product_id = :p OR order_item_id IN (SELECT id FROM (SELECT id FROM order_items WHERE product_id = :p) as tmp)"),
            {"p": product_id}
        )
        db.execute(text("DELETE FROM product_inventory_locations WHERE product_id = :p"), {"p": product_id})
        db.execute(text("DELETE FROM stock_notifications WHERE product_id = :p"), {"p": product_id})
        db.execute(text("DELETE FROM cart_items WHERE product_id = :p"), {"p": product_id})
        db.execute(text("DELETE FROM wishlists WHERE product_id = :p"), {"p": product_id})
        db.execute(text("DELETE FROM reviews WHERE product_id = :p"), {"p": product_id})
        db.execute(text("DELETE FROM order_items WHERE product_id = :p"), {"p": product_id})
        db.execute(text("DELETE FROM product_variants WHERE product_id = :p"), {"p": product_id})
        db.execute(text("DELETE FROM product_images WHERE product_id = :p"), {"p": product_id})

        db.delete(prod)
        db.commit()
        return {"message": f"Product '{prod.name}' deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete product: {str(e)}"
        )
