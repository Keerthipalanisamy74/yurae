from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.mysql import LONGTEXT
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(50), nullable=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="CUSTOMER")  # CUSTOMER or ADMIN
    is_active = Column(Boolean, default=True)
    reset_otp = Column(String(10), nullable=True)
    reset_otp_expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    addresses = relationship("Address", back_populates="user", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="user")
    reviews = relationship("Review", back_populates="user")
    cart = relationship("Cart", back_populates="user", uselist=False, cascade="all, delete-orphan")
    wishlist_items = relationship("Wishlist", back_populates="user", cascade="all, delete-orphan")


class Address(Base):
    __tablename__ = "addresses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    address_type = Column(String(50), default="Home")  # Home, Office, Parents, Other
    name = Column(String(100), nullable=False)
    phone = Column(String(50), nullable=False)
    address_line1 = Column(String(255), nullable=False)
    address_line2 = Column(String(255), nullable=True)
    building_or_flat = Column(String(255), nullable=True)
    landmark = Column(String(255), nullable=True)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    postal_code = Column(String(20), nullable=False)
    country = Column(String(100), default="India")
    is_default = Column(Boolean, default=False)

    user = relationship("User", back_populates="addresses")


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(Text().with_variant(LONGTEXT, "mysql"), nullable=True)
    image = Column(Text().with_variant(LONGTEXT, "mysql"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    products = relationship("Product", back_populates="category")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    name = Column(String(200), nullable=False)
    slug = Column(String(200), unique=True, index=True, nullable=False)
    description = Column(Text().with_variant(LONGTEXT, "mysql"), nullable=True)
    short_description = Column(Text().with_variant(LONGTEXT, "mysql"), nullable=True)
    price = Column(Float, nullable=False)  # Base price in base_currency (INR)
    sale_price = Column(Float, nullable=True)
    base_currency = Column(String(10), default="INR", nullable=False)
    stock_quantity = Column(Integer, default=0)
    sku = Column(String(100), unique=True, nullable=False)
    brand = Column(String(100), default="Yurae Beauty")
    weight = Column(String(50), nullable=True)
    weight_kg = Column(Float, default=0.35)
    length_cm = Column(Float, default=15.0)
    breadth_cm = Column(Float, default=10.0)
    height_cm = Column(Float, default=8.0)
    ingredients = Column(Text().with_variant(LONGTEXT, "mysql"), nullable=True)
    how_to_use = Column(Text().with_variant(LONGTEXT, "mysql"), nullable=True)
    skin_type = Column(String(100), nullable=True)
    status = Column(String(20), default="ACTIVE")
    featured = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    category = relationship("Category", back_populates="products")
    images = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan")
    variants = relationship("ProductVariant", back_populates="product", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="product", cascade="all, delete-orphan")


class ProductImage(Base):
    __tablename__ = "product_images"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    image_url = Column(Text().with_variant(LONGTEXT, "mysql"), nullable=False)
    sort_order = Column(Integer, default=0)

    product = relationship("Product", back_populates="images")


class ProductVariant(Base):
    __tablename__ = "product_variants"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    variant_name = Column(String(100), nullable=False)  # e.g., Size, Shade
    variant_value = Column(String(100), nullable=False)  # e.g., 50ml, S, M, L
    additional_price = Column(Float, default=0.0)
    stock_quantity = Column(Integer, default=0)

    product = relationship("Product", back_populates="variants")


class Cart(Base):
    __tablename__ = "carts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="cart")
    items = relationship("CartItem", back_populates="cart", cascade="all, delete-orphan")


class CartItem(Base):
    __tablename__ = "cart_items"

    id = Column(Integer, primary_key=True, index=True)
    cart_id = Column(Integer, ForeignKey("carts.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    variant_id = Column(Integer, ForeignKey("product_variants.id"), nullable=True)
    quantity = Column(Integer, default=1)
    price = Column(Float, nullable=False)  # Stored in base currency INR

    cart = relationship("Cart", back_populates="items")
    product = relationship("Product")
    variant = relationship("ProductVariant")


class Wishlist(Base):
    __tablename__ = "wishlists"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="wishlist_items")
    product = relationship("Product")


class ExchangeRate(Base):
    __tablename__ = "exchange_rates"

    id = Column(Integer, primary_key=True, index=True)
    base_currency = Column(String(10), default="INR", nullable=False)
    target_currency = Column(String(10), unique=True, index=True, nullable=False)
    rate = Column(Float, nullable=False)  # 1 INR = rate target_currency
    is_active = Column(Boolean, default=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    address_id = Column(Integer, ForeignKey("addresses.id"), nullable=True)
    order_number = Column(String(100), unique=True, index=True, nullable=False)
    currency = Column(String(10), default="INR", nullable=False)
    exchange_rate = Column(Float, default=1.0, nullable=False)
    subtotal = Column(Float, nullable=False)
    discount = Column(Float, default=0.0)
    shipping_fee = Column(Float, default=0.0)
    tax = Column(Float, default=0.0)
    total_amount = Column(Float, nullable=False)
    payment_status = Column(String(50), default="Pending")  # Pending, Paid, Failed, Refunded
    order_status = Column(String(50), default="Pending")    # Pending, Confirmed, Processing, Shipped, Out for Delivery, Delivered, Cancelled, Returned
    
    # Shipping & Fulfillment Fields (Shiprocket)
    shipping_status = Column(String(50), default="NOT_CREATED")  # NOT_CREATED, SHIPMENT_CREATED, AWB_ASSIGNED, PICKUP_SCHEDULED, PICKED_UP, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED, FAILED, CANCELLED, RTO
    shiprocket_order_id = Column(String(100), nullable=True, index=True)
    shiprocket_shipment_id = Column(String(100), nullable=True, index=True)
    awb_code = Column(String(100), nullable=True, index=True)
    courier_name = Column(String(100), nullable=True)
    courier_id = Column(Integer, nullable=True)
    tracking_url = Column(String(500), nullable=True)
    shipping_label_url = Column(String(500), nullable=True)
    shipping_manifest_url = Column(String(500), nullable=True)
    pickup_scheduled_date = Column(String(100), nullable=True)
    pickup_token_number = Column(String(100), nullable=True)
    estimated_delivery_date = Column(String(100), nullable=True)
    shipping_error_log = Column(Text, nullable=True)
    is_cod = Column(Boolean, default=False)
    cod_amount = Column(Float, default=0.0)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="orders")
    address = relationship("Address")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="order", cascade="all, delete-orphan")
    shipment = relationship("Shipment", back_populates="order", uselist=False, cascade="all, delete-orphan")
    tracking_events = relationship("ShippingTrackingEvent", back_populates="order", cascade="all, delete-orphan", order_by="ShippingTrackingEvent.event_time.desc()")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    product_name = Column(String(200), nullable=False)
    variant_info = Column(String(200), nullable=True)
    quantity = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)  # Stored in transaction currency at time of purchase

    order = relationship("Order", back_populates="items")
    product = relationship("Product")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    payment_id = Column(String(100), nullable=False)  # Transaction ID / Gateway ID
    payment_method = Column(String(50), nullable=False)  # Razorpay, Stripe, PayPal, UPI, Card, NetBanking, COD
    currency = Column(String(10), default="INR", nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(String(50), default="SUCCESS")
    created_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("Order", back_populates="payments")


class Shipment(Base):
    __tablename__ = "shipments"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), unique=True, nullable=False)
    provider = Column(String(50), default="shiprocket", nullable=False)
    shipping_service_tier = Column(String(50), default="STANDARD", nullable=False)  # STANDARD, EXPRESS, DHL_PRIORITY
    destination_country = Column(String(100), default="India", nullable=False)
    shipping_cost = Column(Float, default=0.0)
    external_order_id = Column(String(100), nullable=True, index=True)
    external_shipment_id = Column(String(100), nullable=True, index=True)
    awb_code = Column(String(100), nullable=True, index=True)
    courier_id = Column(Integer, nullable=True)
    courier_name = Column(String(100), nullable=True)
    status = Column(String(50), default="SHIPMENT_CREATED", nullable=False)
    weight_kg = Column(Float, default=0.5)
    length_cm = Column(Float, default=15.0)
    breadth_cm = Column(Float, default=10.0)
    height_cm = Column(Float, default=8.0)
    label_url = Column(String(500), nullable=True)
    manifest_url = Column(String(500), nullable=True)
    invoice_url = Column(String(500), nullable=True)
    pickup_token = Column(String(100), nullable=True)
    pickup_date = Column(String(100), nullable=True)
    estimated_delivery = Column(String(100), nullable=True)
    customs_declared_value = Column(Float, nullable=True)
    customs_currency = Column(String(10), nullable=True)
    customs_hs_code = Column(String(50), nullable=True)  # e.g. 3304.99
    customs_description = Column(String(255), nullable=True)
    raw_response = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    order = relationship("Order", back_populates="shipment")


class ShippingTrackingEvent(Base):
    __tablename__ = "shipping_tracking_events"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    shipment_id = Column(Integer, ForeignKey("shipments.id"), nullable=True)
    awb_code = Column(String(100), nullable=True, index=True)
    status = Column(String(50), nullable=False)
    activity = Column(String(255), nullable=False)
    location = Column(String(255), nullable=True)
    event_time = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("Order", back_populates="tracking_events")


class ShippingWebhookEvent(Base):
    __tablename__ = "shipping_webhook_events"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String(150), unique=True, index=True, nullable=True)
    provider = Column(String(50), default="shiprocket", nullable=False)
    event_type = Column(String(100), nullable=False)
    awb_code = Column(String(100), nullable=True, index=True)
    order_number = Column(String(100), nullable=True, index=True)
    status = Column(String(50), nullable=True)
    payload = Column(Text, nullable=False)
    processed = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class ShippingSetting(Base):
    __tablename__ = "shipping_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, index=True, nullable=False)
    value = Column(Text, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Coupon(Base):
    __tablename__ = "coupons"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    discount_type = Column(String(20), nullable=False)  # PERCENTAGE or FIXED
    discount_value = Column(Float, nullable=False)
    minimum_order_amount = Column(Float, default=0.0)
    expiry_date = Column(DateTime, nullable=True)
    usage_limit = Column(Integer, default=100)
    times_used = Column(Integer, default=0)
    active = Column(Boolean, default=True)


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    rating = Column(Integer, nullable=False)  # 1 to 5
    review = Column(Text, nullable=False)
    photo_url = Column(Text, nullable=True)  # Skincare glow or fashion look photo
    is_approved = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="reviews")
    product = relationship("Product", back_populates="reviews")


class ContactMessage(Base):
    __tablename__ = "contact_messages"

    id = Column(Integer, primary_key=True, index=True)
    source = Column(String(50), default="CONTACT_FORM")  # CONTACT_FORM or ORDER_QUERY
    order_number = Column(String(100), nullable=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    subject = Column(String(255), nullable=True)
    rating = Column(String(50), nullable=True)
    message = Column(Text, nullable=False)
    status = Column(String(50), default="UNREAD")  # UNREAD, READ, REPLIED, ARCHIVED
    admin_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class StockNotification(Base):
    __tablename__ = "stock_notifications"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    variant_id = Column(Integer, ForeignKey("product_variants.id"), nullable=True)
    email = Column(String(255), nullable=False, index=True)
    variant_name = Column(String(100), nullable=True)
    variant_value = Column(String(100), nullable=True)
    is_notified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    notified_at = Column(DateTime, nullable=True)

    product = relationship("Product")
    variant = relationship("ProductVariant")



