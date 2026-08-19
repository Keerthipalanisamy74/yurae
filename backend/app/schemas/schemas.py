from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict
from datetime import datetime

# --- Auth & User ---
class UserRegister(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    reset_token: str
    new_password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

# --- Address ---
class AddressBase(BaseModel):
    name: str
    phone: str
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    state: str
    postal_code: str
    country: str = "India"
    is_default: bool = False

class AddressCreate(AddressBase):
    pass

class AddressResponse(AddressBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

# --- Category ---
class CategoryBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    image: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- Product ---
class ProductImageBase(BaseModel):
    image_url: str
    sort_order: int = 0

class ProductImageResponse(ProductImageBase):
    id: int
    product_id: int

    class Config:
        from_attributes = True

class ProductVariantBase(BaseModel):
    variant_name: str
    variant_value: str
    additional_price: float = 0.0
    stock_quantity: int = 0

class ProductVariantResponse(ProductVariantBase):
    id: int
    product_id: int

    class Config:
        from_attributes = True

class ReviewResponse(BaseModel):
    id: int
    user_id: int
    product_id: int
    rating: int
    review: str
    is_approved: bool
    created_at: datetime
    user_name: Optional[str] = None

    class Config:
        from_attributes = True

class ProductBase(BaseModel):
    category_id: int
    name: str
    slug: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    price: float
    sale_price: Optional[float] = None
    base_currency: str = "INR"
    stock_quantity: int = 0
    sku: Optional[str] = None
    brand: str = "Yurae Beauty"
    weight: Optional[str] = None
    ingredients: Optional[str] = None
    how_to_use: Optional[str] = None
    skin_type: Optional[str] = None
    status: str = "ACTIVE"
    featured: bool = False

class ProductCreate(ProductBase):
    images: List[str] = []
    variants: List[ProductVariantBase] = []

class ProductUpdate(BaseModel):
    category_id: Optional[int] = None
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    price: Optional[float] = None
    sale_price: Optional[float] = None
    base_currency: Optional[str] = None
    stock_quantity: Optional[int] = None
    sku: Optional[str] = None
    brand: Optional[str] = None
    weight: Optional[str] = None
    ingredients: Optional[str] = None
    how_to_use: Optional[str] = None
    skin_type: Optional[str] = None
    status: Optional[str] = None
    featured: Optional[bool] = None
    images: Optional[List[str]] = None
    variants: Optional[List[ProductVariantBase]] = None

class ProductResponse(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime
    category: Optional[CategoryResponse] = None
    images: List[ProductImageResponse] = []
    variants: List[ProductVariantResponse] = []
    avg_rating: Optional[float] = 5.0
    review_count: Optional[int] = 0

    class Config:
        from_attributes = True

# --- Cart ---
class CartItemAdd(BaseModel):
    product_id: int
    variant_id: Optional[int] = None
    quantity: int = 1

class CartItemUpdate(BaseModel):
    quantity: int

class CartItemResponse(BaseModel):
    id: int
    cart_id: int
    product_id: int
    variant_id: Optional[int] = None
    quantity: int
    price: float
    product: ProductResponse
    variant: Optional[ProductVariantResponse] = None

    class Config:
        from_attributes = True

class CartResponse(BaseModel):
    id: int
    user_id: int
    items: List[CartItemResponse] = []
    subtotal: float = 0.0
    item_count: int = 0

    class Config:
        from_attributes = True

# --- Wishlist ---
class WishlistAdd(BaseModel):
    product_id: int

class WishlistResponse(BaseModel):
    id: int
    user_id: int
    product_id: int
    created_at: datetime
    product: ProductResponse

    class Config:
        from_attributes = True

# --- Multi-Currency Schemas ---
class CurrencyInfo(BaseModel):
    code: str
    name: str
    symbol: str
    symbol_native: str
    decimal_digits: int
    flag: str
    country: str
    default_shipping_fee: float
    free_shipping_threshold: float

class CurrencyRateResponse(BaseModel):
    base_currency: str
    rates: Dict[str, float]
    currencies: List[CurrencyInfo]
    last_updated: str

class CurrencyConvertRequest(BaseModel):
    amount: float
    from_currency: str = "INR"
    to_currency: str = "USD"

class CurrencyConvertResponse(BaseModel):
    original_amount: float
    from_currency: str
    to_currency: str
    converted_amount: float
    exchange_rate: float
    formatted: str

class ExchangeRateUpdate(BaseModel):
    target_currency: str
    rate: float
    is_active: bool = True

class ShippingEstimateRequest(BaseModel):
    country: str
    subtotal: float
    currency: str = "INR"

class ShippingEstimateResponse(BaseModel):
    country: str
    zone_name: str
    estimated_delivery: str
    currency: str
    shipping_fee: float
    free_shipping_threshold: float
    is_free: bool

# --- Order & Checkout ---
class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    variant_info: Optional[str] = None
    quantity: int
    price: float

    class Config:
        from_attributes = True

class OrderCreate(BaseModel):
    address_id: Optional[int] = None
    new_address: Optional[AddressCreate] = None
    coupon_code: Optional[str] = None
    currency: str = "INR"
    payment_method: str = "Mock Razorpay"

class OrderResponse(BaseModel):
    id: int
    user_id: int
    address_id: Optional[int] = None
    order_number: str
    currency: str = "INR"
    exchange_rate: float = 1.0
    subtotal: float
    discount: float
    shipping_fee: float
    tax: float = 0.0
    total_amount: float
    payment_status: str
    order_status: str
    created_at: datetime
    items: List[OrderItemResponse] = []
    address: Optional[AddressResponse] = None

    class Config:
        from_attributes = True

class OrderStatusUpdate(BaseModel):
    order_status: Optional[str] = None
    payment_status: Optional[str] = None

# --- Coupon ---
class CouponCreate(BaseModel):
    code: str
    discount_type: str  # PERCENTAGE or FIXED
    discount_value: float
    minimum_order_amount: float = 0.0
    expiry_date: Optional[datetime] = None
    usage_limit: int = 100
    active: bool = True

class CouponResponse(CouponCreate):
    id: int
    times_used: int

    class Config:
        from_attributes = True

class CouponApply(BaseModel):
    code: str
    subtotal: float

class CouponApplyResponse(BaseModel):
    valid: bool
    code: str
    discount_type: str
    discount_value: float
    discount_amount: float
    message: str

# --- Review ---
class ReviewCreate(BaseModel):
    product_id: int
    rating: int = Field(..., ge=1, le=5)
    review: str

# --- Admin Dashboard ---
class AdminDashboardStats(BaseModel):
    total_sales: float
    total_orders: int
    total_customers: int
    total_products: int
    pending_orders: int
    low_stock_products: int
    recent_orders: List[OrderResponse] = []
