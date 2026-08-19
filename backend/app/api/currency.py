from datetime import datetime
from typing import List, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import User, ExchangeRate
from app.api.deps import get_current_admin
from app.services.exchange_rate_service import ExchangeRateService, CURRENCY_METADATA
from app.services.shipping_service import ShippingService
from app.schemas.schemas import (
    CurrencyInfo,
    CurrencyRateResponse,
    CurrencyConvertRequest,
    CurrencyConvertResponse,
    ExchangeRateUpdate,
    ShippingEstimateRequest,
    ShippingEstimateResponse,
)

router = APIRouter(prefix="/currencies", tags=["Currencies & Exchange Rates"])

@router.get("", response_model=List[CurrencyInfo])
def get_supported_currencies():
    """
    Retrieve all supported global currencies with symbols, flags, native symbols,
    and decimal digit rules.
    """
    return ExchangeRateService.get_all_currencies_info()

@router.get("/rates", response_model=CurrencyRateResponse)
def get_exchange_rates(db: Session = Depends(get_db)):
    """
    Retrieve latest exchange rates against base currency (INR).
    Cached with 1-hour TTL and backed by DB fallback.
    """
    rates = ExchangeRateService.get_rates(db)
    currencies = ExchangeRateService.get_all_currencies_info()
    return {
        "base_currency": ExchangeRateService.BASE_CURRENCY,
        "rates": rates,
        "currencies": currencies,
        "last_updated": datetime.utcnow().isoformat()
    }

@router.get("/{currency_code}")
def get_single_currency_rate(currency_code: str, db: Session = Depends(get_db)):
    """
    Get exchange rate and metadata for a specific currency code (e.g. USD, EUR).
    """
    code = currency_code.upper()
    info = ExchangeRateService.get_currency_info(code)
    if not info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Currency '{currency_code}' is not supported."
        )

    rates = ExchangeRateService.get_rates(db)
    rate = rates.get(code, 1.0)

    return {
        "base_currency": ExchangeRateService.BASE_CURRENCY,
        "currency": info,
        "rate": rate,
        "inr_per_unit": round(1.0 / rate, 2) if rate > 0 else 0.0
    }

@router.post("/convert", response_model=CurrencyConvertResponse)
def convert_currency(payload: CurrencyConvertRequest, db: Session = Depends(get_db)):
    """
    Convert an amount from one currency to another using authoritative exchange rates.
    """
    from_c = payload.from_currency.upper()
    to_c = payload.to_currency.upper()

    converted = ExchangeRateService.convert_amount(
        amount=payload.amount,
        from_currency=from_c,
        to_currency=to_c,
        db=db
    )

    rates = ExchangeRateService.get_rates(db)
    from_rate = rates.get(from_c, 1.0)
    to_rate = rates.get(to_c, 1.0)
    effective_rate = to_rate / from_rate if from_rate > 0 else 1.0

    meta = CURRENCY_METADATA.get(to_c, {})
    sym = meta.get("symbol", to_c)
    digits = meta.get("decimal_digits", 2)
    formatted = f"{sym}{converted:,.{digits}f}"

    return {
        "original_amount": payload.amount,
        "from_currency": from_c,
        "to_currency": to_c,
        "converted_amount": converted,
        "exchange_rate": effective_rate,
        "formatted": formatted
    }

@router.post("/shipping/estimate", response_model=ShippingEstimateResponse)
def estimate_shipping(payload: ShippingEstimateRequest, db: Session = Depends(get_db)):
    """
    Calculate country shipping fee, free shipping qualification, and estimated delivery.
    """
    return ShippingService.calculate_shipping(
        country=payload.country,
        subtotal=payload.subtotal,
        target_currency=payload.currency,
        db=db
    )

# --- Admin Operations ---

@router.post("/rates/refresh", response_model=CurrencyRateResponse)
def admin_refresh_rates(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    [ADMIN] Trigger on-demand sync with external exchange rate provider.
    """
    rates = ExchangeRateService.get_rates(db=db, force_refresh=True)
    currencies = ExchangeRateService.get_all_currencies_info()
    return {
        "base_currency": ExchangeRateService.BASE_CURRENCY,
        "rates": rates,
        "currencies": currencies,
        "last_updated": datetime.utcnow().isoformat()
    }

@router.put("/{currency_code}/rate")
def admin_update_exchange_rate(
    currency_code: str,
    payload: ExchangeRateUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    [ADMIN] Manually override an exchange rate or toggle currency active status.
    """
    code = currency_code.upper()
    rate_rec = db.query(ExchangeRate).filter(ExchangeRate.target_currency == code).first()
    if not rate_rec:
        rate_rec = ExchangeRate(
            base_currency="INR",
            target_currency=code,
            rate=payload.rate,
            is_active=payload.is_active
        )
        db.add(rate_rec)
    else:
        rate_rec.rate = payload.rate
        rate_rec.is_active = payload.is_active
        rate_rec.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(rate_rec)

    # Invalidate cache
    ExchangeRateService.get_rates(db=db, force_refresh=True)

    return {
        "message": f"Exchange rate for {code} updated successfully.",
        "currency": code,
        "rate": rate_rec.rate,
        "is_active": rate_rec.is_active,
        "updated_at": rate_rec.updated_at.isoformat()
    }
