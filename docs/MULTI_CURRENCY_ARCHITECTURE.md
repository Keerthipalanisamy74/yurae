# Yurae Beauty — Multi-Currency & Global E-Commerce Architecture

This document describes the technical architecture, data models, exchange rate services, payment abstractions, and frontend state management implemented for global multi-currency commerce in **Yurae Beauty**.

---

## 1. Core Architectural Principles

1. **Authoritative Base Currency (INR)**:
   - All product catalog prices (`price`, `sale_price`, `variant.additional_price`) are stored authoritatively in **INR (₹ Indian Rupee)**.
   - Products do not have manually duplicate columns for foreign currencies.
2. **Dynamic Conversion & Display Model**:
   - Customer-selected display currency is converted dynamically using real-time cached exchange rates.
   - Prices across Home, Category catalogs, Product details, Wishlist, Mini-Cart, and full Cart adjust instantly when the customer changes their currency preference.
3. **Transaction Currency Immutability**:
   - When a purchase is completed, the order permanently records the **transaction currency** (e.g. `USD`, `EUR`, `GBP`, `CAD`, `AUD`, `SGD`, `JPY`, `INR`), the applied **exchange rate**, and the monetary breakdown at the time of purchase.
   - Historical orders displayed in the Client Dashboard or Admin Workspace remain in their transaction currency regardless of future exchange rate fluctuations.

---

## 2. Supported Currencies & Metadata

| Code | Currency Name | Symbol | Decimals | Flag | Shipping Threshold | Default Shipping Fee |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **INR** | Indian Rupee (Base) | ₹ | 2 | 🇮🇳 | ₹1,500 | ₹99 |
| **USD** | US Dollar | $ | 2 | 🇺🇸 | $50 | $15 |
| **EUR** | Euro | € | 2 | 🇪🇺 | €45 | €14 |
| **GBP** | British Pound | £ | 2 | 🇬🇧 | £40 | £12 |
| **CAD** | Canadian Dollar | C$ | 2 | 🇨🇦 | C$60 | C$18 |
| **AUD** | Australian Dollar | A$ | 2 | 🇦🇺 | A$70 | A$20 |
| **SGD** | Singapore Dollar | S$ | 2 | 🇸🇬 | S$60 | S$18 |
| **JPY** | Japanese Yen | ¥ | 0 | 🇯🇵 | ¥7,000 | ¥2,000 |

*Note: Japanese Yen (JPY) automatically adheres to standard 0-decimal precision across all displays and transaction calculations.*

---

## 3. Database Schema Changes

### `products` Table
- Added `base_currency VARCHAR(10) DEFAULT 'INR' NOT NULL`.
- `price` (Float): Authoritative base price in INR.
- `sale_price` (Float): Authoritative discount price in INR.

### `exchange_rates` Table
```sql
CREATE TABLE exchange_rates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    base_currency VARCHAR(10) DEFAULT 'INR' NOT NULL,
    target_currency VARCHAR(10) UNIQUE NOT NULL,
    rate FLOAT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### `orders` Table
- Added `currency VARCHAR(10) DEFAULT 'INR' NOT NULL`.
- Added `exchange_rate FLOAT DEFAULT 1.0 NOT NULL`.
- Added `tax FLOAT DEFAULT 0.0 NOT NULL`.
- `subtotal`, `discount`, `shipping_fee`, `total_amount` recorded in the order's transaction currency.

### `payments` Table
- Added `currency VARCHAR(10) DEFAULT 'INR' NOT NULL`.

---

## 4. Exchange Rate Engine & Caching

Located in `backend/app/services/exchange_rate_service.py`:
- **Live Provider Integration**: Connects to `https://open.er-api.com/v6/latest/INR` (or configured `EXCHANGE_RATE_API_URL` with optional `EXCHANGE_RATE_API_KEY`).
- **Caching Layer**: In-memory caching with a 1-hour (3600s) TTL.
- **Database Fallback**: In the event of network disruption or external provider unavailability, loads the last known active rates from MySQL `exchange_rates`.
- **Hardcoded Resilience**: Built-in safe default rates if database is fresh/empty.

---

## 5. Payment Provider Abstraction

Located in `backend/app/services/payment_service.py`:
- `PaymentService.get_provider(payment_method, currency)` resolves the appropriate gateway:
  - **RazorpayPaymentProvider**: Domestic Indian payments (UPI, RuPay, NetBanking, COD, INR).
  - **StripePaymentProvider**: International cards (Visa, Mastercard, American Express across USD, EUR, GBP, CAD, AUD, SGD, JPY).
  - **PayPalPaymentProvider**: Global PayPal wallet & Express checkout.
  - **MockPaymentProvider**: Instant test gateway for local testing and developer environments.

---

## 6. Global Shipping Service

Located in `backend/app/services/shipping_service.py`:
- Calculates destination shipping fees, estimated delivery timelines, and evaluates free-shipping thresholds dynamically per country and transaction currency.

---

## 7. API Reference

All endpoints are documented in Swagger UI at `/docs`:

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/currencies` | List all supported currencies and metadata | No |
| `GET` | `/api/currencies/rates` | List exchange rates against INR | No |
| `GET` | `/api/currencies/{code}` | Get specific currency rate and metadata | No |
| `POST` | `/api/currencies/convert` | Convert amount between two currencies | No |
| `POST` | `/api/currencies/shipping/estimate` | Estimate shipping fee for country & subtotal | No |
| `POST` | `/api/orders` | Place order in transaction currency | Customer / JWT |
| `POST` | `/api/currencies/rates/refresh` | Force sync rates from live API provider | Admin |
| `PUT` | `/api/currencies/{code}/rate` | Override rate or toggle currency active status | Admin |

---

## 8. Frontend State Management & Hooks

### `CurrencyContext` (`frontend/src/context/CurrencyContext.tsx`)
- Provides:
  - `currency`: Active selected currency code (synced to `localStorage['yurae_currency']`).
  - `setCurrency(code)`: Updates currency across all components reactively.
  - `formatPrice(amountInINR, targetCurrency?)`: Formats INR catalog amounts into the active currency with localized symbol and decimal places (e.g. `formatPrice(999)` $\rightarrow$ `$10.43` or `¥1,667`).
  - `formatRawPrice(amount, currencyCode)`: Formats already-converted transaction values (for order history).
  - `currentCurrencyInfo`: Metadata for active currency.

### `CurrencySelector` (`frontend/src/components/common/CurrencySelector.tsx`)
- Embedded in `Navbar.tsx` and `MobileNav.tsx`.
- Minimalist luxury dropdown featuring country flags, currency codes, and symbols.
