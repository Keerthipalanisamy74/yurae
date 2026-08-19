from typing import Dict, Optional
from app.services.exchange_rate_service import ExchangeRateService, CURRENCY_METADATA

# Country to preferred currency mapping
COUNTRY_CURRENCY_MAP: Dict[str, str] = {
    "India": "INR",
    "United States": "USD",
    "United States of America": "USD",
    "USA": "USD",
    "United Kingdom": "GBP",
    "UK": "GBP",
    "Germany": "EUR",
    "France": "EUR",
    "Italy": "EUR",
    "Spain": "EUR",
    "Netherlands": "EUR",
    "Canada": "CAD",
    "Australia": "AUD",
    "Singapore": "SGD",
    "Japan": "JPY",
}

# Country shipping zone rule thresholds
SHIPPING_ZONE_RULES: Dict[str, dict] = {
    "India": {
        "zone_name": "India Domestic",
        "estimated_delivery": "2-4 Business Days",
        "base_currency": "INR",
        "standard_fee": 99.0,
        "free_threshold": 1500.0,
    },
    "United States": {
        "zone_name": "North America (US)",
        "estimated_delivery": "4-7 Business Days",
        "base_currency": "USD",
        "standard_fee": 15.0,
        "free_threshold": 50.0,
    },
    "Canada": {
        "zone_name": "North America (Canada)",
        "estimated_delivery": "5-8 Business Days",
        "base_currency": "CAD",
        "standard_fee": 18.0,
        "free_threshold": 60.0,
    },
    "United Kingdom": {
        "zone_name": "United Kingdom",
        "estimated_delivery": "4-6 Business Days",
        "base_currency": "GBP",
        "standard_fee": 12.0,
        "free_threshold": 40.0,
    },
    "Europe": {
        "zone_name": "European Union",
        "estimated_delivery": "5-8 Business Days",
        "base_currency": "EUR",
        "standard_fee": 14.0,
        "free_threshold": 45.0,
    },
    "Australia": {
        "zone_name": "Australia & Oceania",
        "estimated_delivery": "5-8 Business Days",
        "base_currency": "AUD",
        "standard_fee": 20.0,
        "free_threshold": 70.0,
    },
    "Singapore": {
        "zone_name": "Southeast Asia (Singapore)",
        "estimated_delivery": "3-5 Business Days",
        "base_currency": "SGD",
        "standard_fee": 18.0,
        "free_threshold": 60.0,
    },
    "Japan": {
        "zone_name": "East Asia (Japan)",
        "estimated_delivery": "4-6 Business Days",
        "base_currency": "JPY",
        "standard_fee": 2000.0,
        "free_threshold": 7000.0,
    },
    "International": {
        "zone_name": "Rest of the World Express",
        "estimated_delivery": "7-12 Business Days",
        "base_currency": "USD",
        "standard_fee": 25.0,
        "free_threshold": 80.0,
    },
}

class ShippingService:
    @classmethod
    def get_suggested_currency_for_country(cls, country: str) -> str:
        return COUNTRY_CURRENCY_MAP.get(country.strip(), "INR")

    @classmethod
    def calculate_shipping(
        cls,
        country: str,
        subtotal: float,
        target_currency: str = "INR",
        db = None
    ) -> dict:
        """
        Calculate shipping cost and estimated delivery time based on destination country,
        subtotal in target_currency, and convert results to target_currency.
        """
        country_clean = country.strip()
        target_curr = target_currency.upper()

        # Match zone rule
        if country_clean in SHIPPING_ZONE_RULES:
            rule = SHIPPING_ZONE_RULES[country_clean]
        elif country_clean in ["Germany", "France", "Italy", "Spain", "Netherlands", "Belgium", "Austria", "Sweden", "Switzerland", "Ireland"]:
            rule = SHIPPING_ZONE_RULES["Europe"]
        elif country_clean in ["USA", "United States of America"]:
            rule = SHIPPING_ZONE_RULES["United States"]
        elif country_clean in ["UK", "Great Britain"]:
            rule = SHIPPING_ZONE_RULES["United Kingdom"]
        elif country_clean.lower() == "india":
            rule = SHIPPING_ZONE_RULES["India"]
        else:
            rule = SHIPPING_ZONE_RULES["International"]

        rule_curr = rule["base_currency"]
        rule_fee = rule["standard_fee"]
        rule_threshold = rule["free_threshold"]

        # Convert subtotal into rule's currency to evaluate free threshold
        subtotal_in_rule_curr = ExchangeRateService.convert_amount(
            amount=subtotal,
            from_currency=target_curr,
            to_currency=rule_curr,
            db=db
        )

        is_free = subtotal_in_rule_curr >= rule_threshold

        if is_free:
            fee_in_target_curr = 0.0
        else:
            fee_in_target_curr = ExchangeRateService.convert_amount(
                amount=rule_fee,
                from_currency=rule_curr,
                to_currency=target_curr,
                db=db
            )

        threshold_in_target_curr = ExchangeRateService.convert_amount(
            amount=rule_threshold,
            from_currency=rule_curr,
            to_currency=target_curr,
            db=db
        )

        return {
            "country": country_clean,
            "zone_name": rule["zone_name"],
            "estimated_delivery": rule["estimated_delivery"],
            "currency": target_curr,
            "shipping_fee": fee_in_target_curr,
            "free_shipping_threshold": threshold_in_target_curr,
            "is_free": is_free
        }
