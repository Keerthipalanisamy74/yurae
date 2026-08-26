import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

# Automatically locate and load .env from backend directory or project root
backend_env = Path(__file__).resolve().parent.parent.parent / ".env"
root_env = Path(__file__).resolve().parent.parent.parent.parent / ".env"

if backend_env.exists():
    load_dotenv(dotenv_path=backend_env)
if root_env.exists():
    load_dotenv(dotenv_path=root_env)

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True
    )

    PROJECT_NAME: str = "YURAE BEAUTY"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "yurae_super_secret_jwt_key_2026_luxury_skincare_brand_origin")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database Configuration (MySQL)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "mysql+pymysql://yuraeuser:Keerthi%4007@localhost:3306/yuraedb"
    )

    # Multi-Currency Configuration
    BASE_CURRENCY: str = os.getenv("BASE_CURRENCY", "INR")
    SUPPORTED_CURRENCIES: str = os.getenv(
        "SUPPORTED_CURRENCIES",
        "INR,USD,EUR,GBP,CAD,AUD,SGD,JPY"
    )
    EXCHANGE_RATE_API_URL: str = os.getenv(
        "EXCHANGE_RATE_API_URL",
        "https://open.er-api.com/v6/latest/INR"
    )
    EXCHANGE_RATE_API_KEY: str = os.getenv("EXCHANGE_RATE_API_KEY", "")

    # Payment Gateways (India Domestic & International)
    RAZORPAY_KEY_ID: str = os.getenv("RAZORPAY_KEY_ID", "rzp_test_your_key_id")
    RAZORPAY_KEY_SECRET: str = os.getenv("RAZORPAY_KEY_SECRET", "your_razorpay_key_secret")
    RAZORPAY_WEBHOOK_SECRET: str = os.getenv("RAZORPAY_WEBHOOK_SECRET", "yurae_rzp_webhook_secret_2026")

    STRIPE_PUBLIC_KEY: str = os.getenv("STRIPE_PUBLIC_KEY", "")
    STRIPE_SECRET_KEY: str = os.getenv("STRIPE_SECRET_KEY", "")
    STRIPE_WEBHOOK_SECRET: str = os.getenv("STRIPE_WEBHOOK_SECRET", "yurae_stripe_webhook_secret_2026")

    PAYPAL_CLIENT_ID: str = os.getenv("PAYPAL_CLIENT_ID", "")
    PAYPAL_CLIENT_SECRET: str = os.getenv("PAYPAL_CLIENT_SECRET", "")

    # GST & Legal Business Compliance (India)
    SELLER_COMPANY_NAME: str = os.getenv("SELLER_COMPANY_NAME", "Yurae Beauty & Luxury Apparel Private Limited")
    SELLER_GSTIN: str = os.getenv("SELLER_GSTIN", "33AAECY8721M1Z8")
    SELLER_PAN: str = os.getenv("SELLER_PAN", "AAECY8721M")
    SELLER_STATE: str = os.getenv("SELLER_STATE", "Tamil Nadu")
    SELLER_STATE_CODE: str = os.getenv("SELLER_STATE_CODE", "33")
    SELLER_ADDRESS: str = os.getenv("SELLER_ADDRESS", "74, Avenue Montaigne Botanical Complex, Anna Salai, Chennai, Tamil Nadu - 600002")
    SELLER_EMAIL: str = os.getenv("SELLER_EMAIL", "concierge@yuraebeauty.com")
    SELLER_PHONE: str = os.getenv("SELLER_PHONE", "+91 98765 43210")

    # Shipping & Order Fulfillment (Multi-Region: India Domestic & International)
    SHIPPING_PROVIDER: str = os.getenv("SHIPPING_PROVIDER", "shiprocket")
    SHIPPING_MODE: str = os.getenv("SHIPPING_MODE", "test")  # 'test' or 'live'
    SHIPPING_API_KEY: str = os.getenv("SHIPPING_API_KEY", "")
    SHIPPING_API_SECRET: str = os.getenv("SHIPPING_API_SECRET", "")
    SHIPPING_WEBHOOK_SECRET: str = os.getenv("SHIPPING_WEBHOOK_SECRET", "yurae_universal_webhook_secret_2026")

    # Shiprocket Credentials (India Domestic)
    SHIPROCKET_EMAIL: str = os.getenv("SHIPROCKET_EMAIL", "")
    SHIPROCKET_PASSWORD: str = os.getenv("SHIPROCKET_PASSWORD", "")
    SHIPROCKET_BASE_URL: str = os.getenv("SHIPROCKET_BASE_URL", "https://apiv2.shiprocket.in/v1/external")
    SHIPROCKET_PICKUP_LOCATION: str = os.getenv("SHIPROCKET_PICKUP_LOCATION", "Primary Warehouse")
    SHIPROCKET_WEBHOOK_TOKEN: str = os.getenv("SHIPROCKET_WEBHOOK_TOKEN", "yurae_shiprocket_webhook_secret_2026")
    
    # International Shipping Provider (DHL Express / FedEx / International Adapter)
    INTERNATIONAL_SHIPPING_PROVIDER: str = os.getenv("INTERNATIONAL_SHIPPING_PROVIDER", "dhl_express")
    DHL_API_KEY: str = os.getenv("DHL_API_KEY", "")
    DHL_API_SECRET: str = os.getenv("DHL_API_SECRET", "")
    DHL_ACCOUNT_NUMBER: str = os.getenv("DHL_ACCOUNT_NUMBER", "")
    DHL_BASE_URL: str = os.getenv("DHL_BASE_URL", "https://express.api.dhl.com/mydhlapi/test")

    # Shipping Policy & Rates (India Domestic)
    COD_ENABLED: bool = os.getenv("COD_ENABLED", "true").lower() in ("true", "1", "yes")
    DEFAULT_FLAT_SHIPPING_FEE: float = float(os.getenv("DEFAULT_FLAT_SHIPPING_FEE", "99.0"))
    DEFAULT_FREE_SHIPPING_THRESHOLD: float = float(os.getenv("DEFAULT_FREE_SHIPPING_THRESHOLD", "1500.0"))
    DEFAULT_COD_SURCHARGE: float = float(os.getenv("DEFAULT_COD_SURCHARGE", "0.0"))
    DEFAULT_DOMESTIC_EXPRESS_SURCHARGE: float = float(os.getenv("DEFAULT_DOMESTIC_EXPRESS_SURCHARGE", "100.0"))

    # Shipping Policy & Rates (International)
    DEFAULT_INTERNATIONAL_FLAT_FEE_USD: float = float(os.getenv("DEFAULT_INTERNATIONAL_FLAT_FEE_USD", "15.0"))
    DEFAULT_INTERNATIONAL_FREE_THRESHOLD_USD: float = float(os.getenv("DEFAULT_INTERNATIONAL_FREE_THRESHOLD_USD", "50.0"))
    DEFAULT_INTERNATIONAL_EXPRESS_SURCHARGE_USD: float = float(os.getenv("DEFAULT_INTERNATIONAL_EXPRESS_SURCHARGE_USD", "15.0"))

    # Default Package Dimensions (Beauty Products, Skincare & Accessories)
    DEFAULT_PACKAGE_WEIGHT_KG: float = float(os.getenv("DEFAULT_PACKAGE_WEIGHT_KG", "0.45"))
    DEFAULT_PACKAGE_LENGTH_CM: float = float(os.getenv("DEFAULT_PACKAGE_LENGTH_CM", "15.0"))
    DEFAULT_PACKAGE_BREADTH_CM: float = float(os.getenv("DEFAULT_PACKAGE_BREADTH_CM", "10.0"))
    DEFAULT_PACKAGE_HEIGHT_CM: float = float(os.getenv("DEFAULT_PACKAGE_HEIGHT_CM", "8.0"))

    # Warehouse / Origin Pickup Address (India)
    WAREHOUSE_CONTACT_NAME: str = os.getenv("WAREHOUSE_CONTACT_NAME", "YURAE Fulfillment Atelier")
    WAREHOUSE_EMAIL: str = os.getenv("WAREHOUSE_EMAIL", "logistics@yuraebeauty.com")
    WAREHOUSE_PHONE: str = os.getenv("WAREHOUSE_PHONE", "+91 98765 43210")
    WAREHOUSE_ADDRESS: str = os.getenv("WAREHOUSE_ADDRESS", "Plot 42, Luxury Beauty Park, EPIP Zone, Whitefield")
    WAREHOUSE_ADDRESS_2: str = os.getenv("WAREHOUSE_ADDRESS_2", "Building B, Ground Floor")
    WAREHOUSE_CITY: str = os.getenv("WAREHOUSE_CITY", "Bengaluru")
    WAREHOUSE_STATE: str = os.getenv("WAREHOUSE_STATE", "Karnataka")
    WAREHOUSE_PINCODE: str = os.getenv("WAREHOUSE_PINCODE", "560066")
    WAREHOUSE_COUNTRY: str = os.getenv("WAREHOUSE_COUNTRY", "India")
    
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*"
    ]

settings = Settings()
