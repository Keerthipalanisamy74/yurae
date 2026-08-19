from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import Cart, CartItem, Product, ProductVariant, User
from app.schemas.schemas import CartResponse, CartItemAdd, CartItemUpdate, CartItemResponse
from app.api.deps import get_current_user
from app.api.products import format_product_response

router = APIRouter(prefix="/cart", tags=["Cart"])

def get_or_create_user_cart(user_id: int, db: Session) -> Cart:
    cart = db.query(Cart).filter(Cart.user_id == user_id).first()
    if not cart:
        cart = Cart(user_id=user_id)
        db.add(cart)
        db.commit()
        db.refresh(cart)
    return cart

def format_cart_response(cart: Cart, db: Session) -> dict:
    subtotal = 0.0
    item_count = 0
    formatted_items = []

    for item in cart.items:
        prod_dict = format_product_response(item.product, db)
        price_used = item.price
        subtotal += price_used * item.quantity
        item_count += item.quantity

        formatted_items.append({
            "id": item.id,
            "cart_id": item.cart_id,
            "product_id": item.product_id,
            "variant_id": item.variant_id,
            "quantity": item.quantity,
            "price": price_used,
            "product": prod_dict,
            "variant": item.variant
        })

    return {
        "id": cart.id,
        "user_id": cart.user_id,
        "items": formatted_items,
        "subtotal": round(subtotal, 2),
        "item_count": item_count
    }

@router.get("", response_model=CartResponse)
def get_cart(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cart = get_or_create_user_cart(current_user.id, db)
    return format_cart_response(cart, db)

@router.post("/items", response_model=CartResponse)
def add_to_cart(
    item_in: CartItemAdd,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cart = get_or_create_user_cart(current_user.id, db)
    product = db.query(Product).filter(Product.id == item_in.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    unit_price = product.sale_price if product.sale_price else product.price

    # Check variant if provided
    variant = None
    if item_in.variant_id:
        variant = db.query(ProductVariant).filter(ProductVariant.id == item_in.variant_id).first()
        if variant:
            unit_price += variant.additional_price

    # Existing item in cart?
    existing_item = db.query(CartItem).filter(
        CartItem.cart_id == cart.id,
        CartItem.product_id == item_in.product_id,
        CartItem.variant_id == item_in.variant_id
    ).first()

    if existing_item:
        existing_item.quantity += item_in.quantity
    else:
        new_item = CartItem(
            cart_id=cart.id,
            product_id=item_in.product_id,
            variant_id=item_in.variant_id,
            quantity=item_in.quantity,
            price=unit_price
        )
        db.add(new_item)

    db.commit()
    db.refresh(cart)
    return format_cart_response(cart, db)

@router.put("/items/{item_id}", response_model=CartResponse)
def update_cart_item(
    item_id: int,
    item_in: CartItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cart = get_or_create_user_cart(current_user.id, db)
    item = db.query(CartItem).filter(CartItem.id == item_id, CartItem.cart_id == cart.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    if item_in.quantity <= 0:
        db.delete(item)
    else:
        item.quantity = item_in.quantity

    db.commit()
    db.refresh(cart)
    return format_cart_response(cart, db)

@router.delete("/items/{item_id}", response_model=CartResponse)
def remove_cart_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cart = get_or_create_user_cart(current_user.id, db)
    item = db.query(CartItem).filter(CartItem.id == item_id, CartItem.cart_id == cart.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    db.delete(item)
    db.commit()
    db.refresh(cart)
    return format_cart_response(cart, db)

@router.delete("", response_model=CartResponse)
def clear_cart(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cart = get_or_create_user_cart(current_user.id, db)
    db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
    db.commit()
    db.refresh(cart)
    return format_cart_response(cart, db)
