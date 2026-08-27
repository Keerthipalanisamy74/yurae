import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.database.session import engine, Base
import app.models.models  # Register all models with Base.metadata
from app.api import auth, products, categories, cart, wishlist, orders, coupons, reviews, admin, currency, contact, shipping, seo, webhooks

# Create tables automatically
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Static Files for Review Glow/Look Photo Uploads
uploads_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(os.path.join(uploads_dir, "reviews"), exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(products.router, prefix=settings.API_V1_STR)
app.include_router(categories.router, prefix=settings.API_V1_STR)
app.include_router(currency.router, prefix=settings.API_V1_STR)
app.include_router(cart.router, prefix=settings.API_V1_STR)
app.include_router(wishlist.router, prefix=settings.API_V1_STR)
app.include_router(orders.router, prefix=settings.API_V1_STR)
app.include_router(shipping.router, prefix=settings.API_V1_STR)
app.include_router(webhooks.router, prefix=settings.API_V1_STR)
app.include_router(coupons.router, prefix=settings.API_V1_STR)
app.include_router(reviews.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)
app.include_router(contact.router, prefix=settings.API_V1_STR)
app.include_router(contact.router, prefix="/api/contact-messages", tags=["Contact Messages Alias"])
app.include_router(seo.router)

# Generic Webhook Route Alias
from app.api.shipping import shiprocket_webhook
from app.api.webhooks import razorpay_webhook, stripe_webhook
app.add_api_route("/api/webhooks/shipping", shiprocket_webhook, methods=["POST"], tags=["Shipping & Order Fulfillment"])

@app.get("/")
def root():
    return {
        "brand": "Yurae Beauty",
        "tagline": "The Origin of Skincare",
        "status": "Operational",
        "docs": "/docs",
        "version": settings.VERSION
    }

@app.get("/api/health")
@app.get("/health")
def health_check():
    return {"status": "ok", "brand": "Yurae Beauty", "version": settings.VERSION}
