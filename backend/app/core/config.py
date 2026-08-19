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

    STRIPE_PUBLIC_KEY: str = os.getenv("STRIPE_PUBLIC_KEY", "")
    STRIPE_SECRET_KEY: str = os.getenv("STRIPE_SECRET_KEY", "")

    PAYPAL_CLIENT_ID: str = os.getenv("PAYPAL_CLIENT_ID", "")
    PAYPAL_CLIENT_SECRET: str = os.getenv("PAYPAL_CLIENT_SECRET", "")
    
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*"
    ]

settings = Settings()
