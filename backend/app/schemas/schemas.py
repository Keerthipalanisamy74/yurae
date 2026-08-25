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

class VerifyOtpRequest(BaseModel):
    email: EmailStr
    otp: str

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

# --- Address ---
class AddressBase(BaseModel):
    name: str
    phone: str
    address_type: Optional[str] = "Home"  # Home, Office, Parents, Other
    address_line1: str
    address_line2: Optional[str] = None
    building_or_flat: Optional[str] = None
    landmark: Optional[str] = None
    city: str
    state: str
    postal_code: str
    country: str = "India"
    is_default: bool = False

class AddressCreate(AddressBase):
    pass

class AddressUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address_type: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    building_or_flat: Optional[str] = None
    landmark: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    is_default: Optional[bool] = None

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
    photo_url: Optional[str] = None
    is_approved: bool
    created_at: datetime
    user_name: Optional[str] = None
    product_name: Optional[str] = None
    product_slug: Optional[str] = None
    is_verified_buyer: Optional[bool] = False

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
    weight_kg: Optional[float] = 0.35
    length_cm: Optional[float] = 15.0
    breadth_cm: Optional[float] = 10.0
    height_cm: Optional[float] = 8.0
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
    weight_kg: Optional[float] = None
    length_cm: Optional[float] = None
    breadth_cm: Optional[float] = None
    height_cm: Optional[float] = None
    ingredients: Optional[str] = None
    how_to_use: Optional[str] = None
    skin_type: Optional[str] = None
    status: Optional[str] = None
    featured: Optional[bool] = None
    images: Optional[List[str]] = None
    variants: Optional[List[ProductVariantBase]] = None

class RestockRequest(BaseModel):
    add_quantity: int = Field(default=10, ge=1)
    variant_id: Optional[int] = None

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
    payment_method: str = "COD"
    is_paid: bool = False
    payment_id: Optional[str] = None

class PaymentResponse(BaseModel):
    id: int
    order_id: int
    payment_id: Optional[str] = None
    payment_method: str
    currency: str = "INR"
    amount: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

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
    
    # Shipping & Fulfillment Fields
    shipping_status: Optional[str] = "NOT_CREATED"
    shiprocket_order_id: Optional[str] = None
    shiprocket_shipment_id: Optional[str] = None
    awb_code: Optional[str] = None
    courier_name: Optional[str] = None
    courier_id: Optional[int] = None
    tracking_url: Optional[str] = None
    shipping_label_url: Optional[str] = None
    shipping_manifest_url: Optional[str] = None
    pickup_scheduled_date: Optional[str] = None
    pickup_token_number: Optional[str] = None
    estimated_delivery_date: Optional[str] = None
    shipping_error_log: Optional[str] = None
    is_cod: Optional[bool] = False
    cod_amount: Optional[float] = 0.0

    created_at: datetime
    updated_at: Optional[datetime] = None
    items: List[OrderItemResponse] = []
    payments: List[PaymentResponse] = []
    address: Optional[AddressResponse] = None
    user: Optional[UserResponse] = None

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
    duration_days: Optional[int] = None
    usage_limit: int = 100
    active: bool = True

class CouponUpdate(BaseModel):
    code: Optional[str] = None
    discount_type: Optional[str] = None
    discount_value: Optional[float] = None
    minimum_order_amount: Optional[float] = None
    expiry_date: Optional[datetime] = None
    duration_days: Optional[int] = None
    usage_limit: Optional[int] = None
    active: Optional[bool] = None

class CouponResponse(BaseModel):
    id: int
    code: str
    discount_type: str
    discount_value: float
    minimum_order_amount: float
    expiry_date: Optional[datetime] = None
    usage_limit: int
    times_used: int
    active: bool

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
    photo_url: Optional[str] = None

# --- Admin Dashboard ---
class AdminDashboardStats(BaseModel):
    total_sales: float
    total_orders: int
    total_customers: int
    total_products: int
    pending_orders: int
    low_stock_products: int
    recent_orders: List[OrderResponse] = []

# --- Contact Messages & Order Queries ---
class ContactMessageCreate(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    subject: Optional[str] = None
    message: str
    source: Optional[str] = "CONTACT_FORM"  # CONTACT_FORM or ORDER_QUERY
    order_number: Optional[str] = None
    rating: Optional[str] = None

class ContactMessageUpdate(BaseModel):
    status: Optional[str] = None  # UNREAD, READ, REPLIED, ARCHIVED
    admin_notes: Optional[str] = None

class ContactMessageResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str] = None
    subject: Optional[str] = None
    message: str
    status: str
    source: Optional[str] = "CONTACT_FORM"
    order_number: Optional[str] = None
    rating: Optional[str] = None
    admin_notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- Shipping & Fulfillment (Domestic India & Global International) ---
class CourierOption(BaseModel):
    courier_id: int
    courier_name: str
    rate: float
    estimated_delivery_days: str
    etd: Optional[str] = None
    rating: Optional[float] = 4.8
    is_cod_available: bool = True
    is_recommended: bool = False
    service_tier: str = "STANDARD"  # STANDARD, EXPRESS, DHL_PRIORITY
    currency: str = "INR"

class CustomsInfo(BaseModel):
    declared_value: float
    currency: str = "USD"
    hs_code: str = "3304.99"
    description: str = "Luxury Cosmetics & Skincare Products"
    country_of_origin: str = "India"

class ServiceabilityRequest(BaseModel):
    pincode: Optional[str] = None
    postal_code: Optional[str] = None
    country: str = "India"
    weight_kg: Optional[float] = 0.45
    length_cm: Optional[float] = 15.0
    breadth_cm: Optional[float] = 10.0
    height_cm: Optional[float] = 8.0
    service_tier: Optional[str] = "STANDARD"
    is_cod: bool = False
    subtotal: Optional[float] = 0.0
    currency: Optional[str] = "INR"

class ServiceabilityResponse(BaseModel):
    pincode: Optional[str] = None
    postal_code: Optional[str] = None
    country: str = "India"
    city: Optional[str] = None
    state: Optional[str] = None
    is_serviceable: bool
    delivery_status_message: str
    estimated_delivery: str
    shipping_fee: float
    is_free: bool
    free_shipping_threshold: float
    recommended_courier: Optional[str] = None
    available_couriers: List[CourierOption] = []
    currency: str = "INR"
    is_international: bool = False
    customs_notice: Optional[str] = None

class ShipmentResponse(BaseModel):
    id: int
    order_id: int
    provider: str
    shipping_service_tier: str = "STANDARD"
    destination_country: str = "India"
    shipping_cost: float = 0.0
    external_order_id: Optional[str] = None
    external_shipment_id: Optional[str] = None
    awb_code: Optional[str] = None
    courier_id: Optional[int] = None
    courier_name: Optional[str] = None
    status: str
    weight_kg: float
    length_cm: float
    breadth_cm: float
    height_cm: float
    label_url: Optional[str] = None
    manifest_url: Optional[str] = None
    invoice_url: Optional[str] = None
    pickup_token: Optional[str] = None
    pickup_date: Optional[str] = None
    estimated_delivery: Optional[str] = None
    customs_declared_value: Optional[float] = None
    customs_currency: Optional[str] = None
    customs_hs_code: Optional[str] = None
    customs_description: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ShippingTrackingEventResponse(BaseModel):
    id: int
    order_id: int
    awb_code: Optional[str] = None
    status: str
    activity: str
    location: Optional[str] = None
    event_time: datetime

    class Config:
        from_attributes = True

class TrackingResponse(BaseModel):
    order_number: str
    awb_code: Optional[str] = None
    courier_name: Optional[str] = None
    current_status: str
    shipping_status: str
    estimated_delivery: Optional[str] = None
    tracking_url: Optional[str] = None
    pickup_date: Optional[str] = None
    events: List[ShippingTrackingEventResponse] = []

class AWBAssignRequest(BaseModel):
    courier_id: Optional[int] = None

class PickupScheduleRequest(BaseModel):
    pickup_date: Optional[str] = None

class ShippingLabelResponse(BaseModel):
    success: bool
    label_url: Optional[str] = None
    order_number: Optional[str] = None
    awb_code: Optional[str] = None
    manifest_url: Optional[str] = None
    message: Optional[str] = "Shipping label retrieved successfully."

class ShippingSettingsResponse(BaseModel):
    shipping_provider: str
    shipping_mode: str
    cod_enabled: bool
    flat_shipping_fee: float
    free_shipping_threshold: float
    cod_surcharge: float
    default_package_weight_kg: float
    default_package_length_cm: float
    default_package_breadth_cm: float
    default_package_height_cm: float
    warehouse_contact_name: str
    warehouse_email: str
    warehouse_phone: str
    warehouse_address: str
    warehouse_address_2: Optional[str] = None
    warehouse_city: str
    warehouse_state: str
    warehouse_pincode: str
    warehouse_country: str
    is_shiprocket_connected: bool

class ShippingSettingsUpdate(BaseModel):
    cod_enabled: Optional[bool] = None
    flat_shipping_fee: Optional[float] = None
    free_shipping_threshold: Optional[float] = None
    cod_surcharge: Optional[float] = None
    default_package_weight_kg: Optional[float] = None
    default_package_length_cm: Optional[float] = None
    default_package_breadth_cm: Optional[float] = None
    default_package_height_cm: Optional[float] = None
    warehouse_contact_name: Optional[str] = None
    warehouse_email: Optional[str] = None
    warehouse_phone: Optional[str] = None
    warehouse_address: Optional[str] = None
    warehouse_address_2: Optional[str] = None
    warehouse_city: Optional[str] = None
    warehouse_state: Optional[str] = None
    warehouse_pincode: Optional[str] = None
    warehouse_country: Optional[str] = None

# --- Stock Notifications (Back in Stock Alerts) ---
class StockNotificationCreate(BaseModel):
    email: EmailStr
    variant_id: Optional[int] = None
    variant_value: Optional[str] = None

class StockNotificationResponse(BaseModel):
    id: int
    product_id: int
    variant_id: Optional[int] = None
    email: EmailStr
    variant_value: Optional[str] = None
    is_notified: bool
    created_at: datetime

    class Config:
        from_attributes = True



