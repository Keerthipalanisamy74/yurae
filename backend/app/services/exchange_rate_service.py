import json
import time
import urllib.request
import urllib.error
from datetime import datetime
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.models import ExchangeRate

# Currency metadata registry
CURRENCY_METADATA: Dict[str, dict] = {
    "INR": {
        "code": "INR",
        "name": "Indian Rupee",
        "symbol": "₹",
        "symbol_native": "₹",
        "decimal_digits": 2,
        "flag": "🇮🇳",
        "country": "India",
        "default_shipping_fee": 99.0,
        "free_shipping_threshold": 1500.0,
    },
    "USD": {
        "code": "USD",
        "name": "US Dollar",
        "symbol": "$",
        "symbol_native": "$",
        "decimal_digits": 2,
        "flag": "🇺🇸",
        "country": "United States",
        "default_shipping_fee": 15.0,
        "free_shipping_threshold": 50.0,
    },
    "EUR": {
        "code": "EUR",
        "name": "Euro",
        "symbol": "€",
        "symbol_native": "€",
        "decimal_digits": 2,
        "flag": "🇪🇺",
        "country": "European Union",
        "default_shipping_fee": 14.0,
        "free_shipping_threshold": 45.0,
    },
    "GBP": {
        "code": "GBP",
        "name": "British Pound",
        "symbol": "£",
        "symbol_native": "£",
        "decimal_digits": 2,
        "flag": "🇬🇧",
        "country": "United Kingdom",
        "default_shipping_fee": 12.0,
        "free_shipping_threshold": 40.0,
    },
    "CAD": {
        "code": "CAD",
        "name": "Canadian Dollar",
        "symbol": "C$",
        "symbol_native": "$",
        "decimal_digits": 2,
        "flag": "🇨🇦",
        "country": "Canada",
        "default_shipping_fee": 18.0,
        "free_shipping_threshold": 60.0,
    },
    "AUD": {
        "code": "AUD",
        "name": "Australian Dollar",
        "symbol": "A$",
        "symbol_native": "$",
        "decimal_digits": 2,
        "flag": "🇦🇺",
        "country": "Australia",
        "default_shipping_fee": 20.0,
        "free_shipping_threshold": 70.0,
    },
    "SGD": {
        "code": "SGD",
        "name": "Singapore Dollar",
        "symbol": "S$",
        "symbol_native": "$",
        "decimal_digits": 2,
        "flag": "🇸🇬",
        "country": "Singapore",
        "default_shipping_fee": 18.0,
        "free_shipping_threshold": 60.0,
    },
    "JPY": {
        "code": "JPY",
        "name": "Japanese Yen",
        "symbol": "¥",
        "symbol_native": "￥",
        "decimal_digits": 0,  # JPY has 0 decimals
        "flag": "🇯🇵",
        "country": "Japan",
        "default_shipping_fee": 2000.0,
        "free_shipping_threshold": 7000.0,
    },
}

# In-memory rates cache
_CACHE = {
    "rates": {},
    "last_fetched": 0.0,
    "ttl": 3600.0,  # 1 hour
}

class ExchangeRateService:
    BASE_CURRENCY = "INR"

    @classmethod
    def get_supported_currency_codes(cls) -> List[str]:
        codes = settings.SUPPORTED_CURRENCIES.split(",")
        return [c.strip().upper() for c in codes if c.strip()]

    @classmethod
    def get_currency_info(cls, code: str) -> Optional[dict]:
        return CURRENCY_METADATA.get(code.upper())

    @classmethod
    def get_all_currencies_info(cls) -> List[dict]:
        supported = cls.get_supported_currency_codes()
        res = []
        for code in supported:
            if code in CURRENCY_METADATA:
                res.append(CURRENCY_METADATA[code])
        return res

    @classmethod
    def fetch_rates_from_api(cls) -> Optional[Dict[str, float]]:
        """Fetch live exchange rates from configured provider API."""
        try:
            url = settings.EXCHANGE_RATE_API_URL or "https://open.er-api.com/v6/latest/INR"
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "YuraeBeauty-Ecommerce/1.0"}
            )
            with urllib.request.urlopen(req, timeout=5) as response:
                if response.status == 200:
                    data = json.loads(response.read().decode("utf-8"))
                    # open.er-api format has 'rates' object
                    rates = data.get("rates") or data.get("conversion_rates") or {}
                    if rates and "USD" in rates:
                        return rates
        except Exception as e:
            print(f"[WARNING] Exchange rate API fetch error: {e}")
        return None

    @classmethod
    def get_rates(cls, db: Optional[Session] = None, force_refresh: bool = False) -> Dict[str, float]:
        """
        Get exchange rates with 1-hour in-memory cache + DB fallback + safe default fallback.
        Rates are relative to 1 INR (e.g. 1 INR = 0.0116 USD).
        """
        now = time.time()
        supported = cls.get_supported_currency_codes()

        # 1. Return from in-memory cache if fresh
        if not force_refresh and _CACHE["rates"] and (now - _CACHE["last_fetched"] < _CACHE["ttl"]):
            return _CACHE["rates"]

        # 2. Try fetching from live external API
        live_rates = cls.fetch_rates_from_api()
        if live_rates:
            filtered_rates = {"INR": 1.0}
            for cur in supported:
                if cur in live_rates:
                    filtered_rates[cur] = float(live_rates[cur])

            # Update in-memory cache
            _CACHE["rates"] = filtered_rates
            _CACHE["last_fetched"] = now

            # Sync to Database if session provided
            if db:
                try:
                    for cur, rate_val in filtered_rates.items():
                        existing = db.query(ExchangeRate).filter(ExchangeRate.target_currency == cur).first()
                        if existing:
                            existing.rate = rate_val
                            existing.updated_at = datetime.utcnow()
                        else:
                            db.add(ExchangeRate(
                                base_currency="INR",
                                target_currency=cur,
                                rate=rate_val,
                                is_active=True
                            ))
                    db.commit()
                except Exception as e:
                    print(f"[WARNING] Failed to sync exchange rates to DB: {e}")
                    db.rollback()

            return filtered_rates

        # 3. If API fails, try Database fallback
        if db:
            try:
                db_rates = db.query(ExchangeRate).filter(ExchangeRate.is_active == True).all()
                if db_rates:
                    res = {"INR": 1.0}
                    for item in db_rates:
                        res[item.target_currency] = float(item.rate)
                    _CACHE["rates"] = res
                    _CACHE["last_fetched"] = now
                    return res
            except Exception as e:
                print(f"[WARNING] Failed to load exchange rates from DB: {e}")

        # 4. Safe hardcoded fallback rates
        safe_fallback = {
            "INR": 1.0,
            "USD": 0.0116,
            "EUR": 0.0111,
            "GBP": 0.0094,
            "CAD": 0.0163,
            "AUD": 0.0182,
            "SGD": 0.0157,
            "JPY": 1.78,
        }
        _CACHE["rates"] = safe_fallback
        _CACHE["last_fetched"] = now
        return safe_fallback

    @classmethod
    def convert_amount(
        cls,
        amount: float,
        from_currency: str = "INR",
        to_currency: str = "INR",
        db: Optional[Session] = None
    ) -> float:
        """
        Convert monetary amount from one currency to another.
        """
        from_curr = from_currency.upper()
        to_curr = to_currency.upper()

        if from_curr == to_curr or amount == 0.0:
            return round(amount, 2 if to_curr != "JPY" else 0)

        rates = cls.get_rates(db)

        # Convert from_currency -> INR
        from_rate = rates.get(from_curr, 1.0)
        if from_curr == "INR":
            amount_in_inr = amount
        else:
            amount_in_inr = amount / from_rate if from_rate > 0 else amount

        # Convert INR -> to_currency
        to_rate = rates.get(to_curr, 1.0)
        converted = amount_in_inr * to_rate

        decimals = CURRENCY_METADATA.get(to_curr, {}).get("decimal_digits", 2)
        return round(converted, decimals if decimals > 0 else 0)
