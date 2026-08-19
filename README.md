# Yurae Beauty

**Premium Global Beauty & Lifestyle E-Commerce Platform**

---

## 🚧 Project Status

> **Work in Progress**: Yurae Beauty is currently under active development. This repository contains the working development version with core functionality, product catalog management, global multi-currency engine, and customer shopping workflows.

---

## 🌸 About

**Yurae Beauty** is a luxury Korean-inspired beauty and lifestyle e-commerce platform designed to provide a minimalist, aesthetic shopping experience. The platform features curated botanical skincare formulations, Mulberry silk apparel, and handcrafted minimalist pearl and gold jewelry.

Built with a high-performance **FastAPI (Python)** backend and a dynamic **React 19 + TypeScript + Vite + Tailwind CSS** frontend, the platform incorporates real-time international multi-currency pricing, zone-based shipping calculation, and global payment provider abstractions.

---

## ✨ Current Features

- **Client Authentication & Profile Management**:
  - JWT-based authentication (Bearer tokens) with secure bcrypt password hashing.
  - User registration, login, profile management, and password change.
- **Product & Catalog Management**:
  - Three core collections: **Skincare**, **Fashion**, and **Accessories**.
  - Dynamic size variants for fashion items (`XS`, `S`, `M`, `L`, `XL`, `XXL`, `XXXL`).
  - Curated accessory categories: `Ring`, `Necklace`, `Bracelet`, `Earrings`.
  - Automated unique slug and SKU generation.
  - High-resolution product image upload support (`LONGTEXT` data storage).
- **Global Multi-Currency Engine**:
  - Authoritative base pricing in **INR (₹)** with real-time conversion into **USD ($)**, **EUR (€)**, **GBP (£)**, **CAD (C$)**, **AUD (A$)**, **SGD (S$)**, and **JPY (¥)**.
  - Specialized 0-decimal banking rounding for Japanese Yen (JPY).
  - 1-hour TTL in-memory rate caching with automated MySQL database fallback.
  - Currency selector dropdown embedded in navigation headers.
- **Shopping Bag & Wishlist**:
  - Interactive slide-out mini-bag and full cart page.
  - Dynamic free-shipping progress indicators per transaction currency.
  - Wishlist management with one-click move to cart.
  - Promo & coupon code application with instant percentage and fixed discounts.
- **Multi-Zone Shipping & Regional Checkout**:
  - Automated shipping zone estimation (India domestic, North America, Europe, UK, Asia-Pacific).
  - Dynamic payment provider resolution (Razorpay/UPI/Cards for India, Stripe/PayPal for international).
  - Immutable transaction currency and exchange rate recording on completed orders.
- **Admin Workspace**:
  - Metrics dashboard (Total Revenue, Orders, Customers, Low-Stock alerts).
  - Product management with quick-delete options.
  - Order status workflow management (`Pending` $\rightarrow$ `Confirmed` $\rightarrow$ `Processing` $\rightarrow$ `Shipped` $\rightarrow$ `Delivered`).
  - Currency & exchange rate monitoring with manual live API sync trigger.
- **Luxury Aesthetic**:
  - Rose Milk Pink brand design system (`#D84B7E`, `#FDF4F7`, `#FFF8FA`, `#F1BCCE`).

---

## 🔄 In Progress

- Multi-currency payment gateway live webhook integrations (Stripe Webhooks & Razorpay Webhooks).
- Automated customer order confirmation email delivery.
- Advanced product search and filtering with full-text search indexing.
- Production containerization and cloud CI/CD deployment pipeline.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 19, TypeScript
- **Build Tool**: Vite v8
- **Styling**: Tailwind CSS, Lucide React Icons, Framer Motion
- **Routing**: React Router v7
- **HTTP Client**: Axios

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **ASGI Server**: Uvicorn
- **ORM & Database Toolkit**: SQLAlchemy 2.0
- **Validation**: Pydantic v2 & Pydantic-Settings
- **Security**: Python-Jose (JWT), Passlib (Bcrypt), Python-Multipart
- **HTTP Client**: HTTPX (Async/Sync live exchange rate fetching)

### Database
- **Primary Database**: MySQL 8.0+ (PyMySQL driver)
- **Local Fallback**: SQLite support

---

## 📁 Project Structure

```
yurae/
├── backend/                        # FastAPI Backend Application
│   ├── app/
│   │   ├── api/                    # API Route Handlers
│   │   │   ├── auth.py             # User authentication & profile
│   │   │   ├── products.py         # Products & categories CRUD
│   │   │   ├── cart.py             # Shopping cart endpoints
│   │   │   ├── wishlist.py         # Wishlist endpoints
│   │   │   ├── orders.py           # Multi-currency checkout & orders
│   │   │   ├── coupons.py          # Coupon management & validation
│   │   │   ├── currency.py         # Exchange rates & conversion API
│   │   │   ├── admin.py            # Admin metrics & order management
│   │   │   └── deps.py             # Auth dependencies & DB session injection
│   │   ├── core/                   # Security & configuration
│   │   │   ├── config.py           # App settings & environment loader
│   │   │   └── security.py         # JWT tokens & password hashing
│   │   ├── database/               # DB connection & migrations
│   │   │   ├── session.py          # SQLAlchemy engine & session maker
│   │   │   └── migrate_multicurrency.py
│   │   ├── models/                 # SQLAlchemy ORM Models
│   │   │   └── models.py
│   │   ├── schemas/                # Pydantic Schemas & Request/Response Models
│   │   │   └── schemas.py
│   │   └── services/               # Core Business Engines
│   │       ├── exchange_rate_service.py # Live rates & currency conversion
│   │       ├── shipping_service.py      # Zone-based shipping calculation
│   │       └── payment_service.py       # Payment provider abstractions
│   ├── tests/                      # Automated test suites
│   │   └── test_multicurrency.py
│   ├── main.py                     # FastAPI ASGI entrypoint
│   └── requirements.txt            # Python dependencies
│
├── frontend/                       # React 19 Frontend Application
│   ├── src/
│   │   ├── components/             # Reusable UI components
│   │   │   └── common/             # Navbar, Footer, ProductCard, CurrencySelector
│   │   ├── context/                # React Context Providers
│   │   │   ├── AuthContext.tsx     # Authentication state
│   │   │   ├── CartContext.tsx     # Cart drawer & items state
│   │   │   ├── WishlistContext.tsx # Wishlist state
│   │   │   ├── CurrencyContext.tsx # Multi-currency formatting & state
│   │   │   └── ToastContext.tsx    # Toast notifications
│   │   ├── pages/                  # Page Views
│   │   │   ├── Home.tsx            # Landing & hero page
│   │   │   ├── Shop.tsx            # Catalog & filtering
│   │   │   ├── ProductDetails.tsx  # Product details & size selector
│   │   │   ├── CartPage.tsx        # Beauty bag page
│   │   │   ├── CheckoutPage.tsx    # International checkout
│   │   │   ├── AccountPage.tsx     # Client profile & order history
│   │   │   ├── AuthPages.tsx       # Login, Register, Forgot Password
│   │   │   ├── AdminDashboard.tsx  # Admin dashboard & currency tab
│   │   │   └── InfoPages.tsx       # Brand story, FAQ, Shipping info
│   │   ├── services/               # Axios API client
│   │   │   └── api.ts
│   │   ├── types/                  # TypeScript interfaces
│   │   │   └── index.ts
│   │   ├── App.tsx                 # Application Router
│   │   └── main.tsx                # React DOM entrypoint
│   ├── package.json
│   └── vite.config.ts
│
├── docs/                           # Technical architecture documentation
│   └── MULTI_CURRENCY_ARCHITECTURE.md
├── .env.example                    # Environment template with placeholders
├── .gitignore                      # Comprehensive Git exclusion rules
└── README.md
```

---

## 🚀 Installation & Local Setup

### Prerequisites
- **Python**: 3.11 or higher
- **Node.js**: 18.0 or higher & npm
- **MySQL**: 8.0 or higher (or MySQL Community Server)
- **Git**

### 1. Clone the Repository
```bash
git clone <GITHUB_REPOSITORY_URL>
cd yurae
```

### 2. Configure Environment Variables
Copy `.env.example` to create your local `.env` file:
```bash
cp .env.example .env
```
Edit `.env` with your MySQL database credentials and secret key:
```env
PROJECT_NAME="YURAE BEAUTY"
SECRET_KEY="your_super_secret_jwt_key_here"
DATABASE_URL="mysql+pymysql://root:password@localhost:3306/yuraedb"
```

### 3. Backend Setup
```bash
cd backend
python -m venv venv

# On Windows:
.\venv\Scripts\activate

# On macOS/Linux:
# source venv/bin/activate

pip install -r requirements.txt
```

### 4. Frontend Setup
```bash
cd ../frontend
npm install
```

---

## 💻 Running the Application

### Start the FastAPI Backend Server
```bash
# From backend/ directory with virtual environment activated:
python -m uvicorn main:app --reload --port 8000
```
Backend API will be running at: `http://127.0.0.1:8000`

### Start the React Frontend Dev Server
```bash
# From frontend/ directory:
npm run dev
```
Frontend Web Application will be running at: `http://localhost:5173`

---

## 📖 API Documentation

Interactive OpenAPI / Swagger documentation is available when running the backend:
- **Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## 🧪 Running Tests

Run the backend multi-currency test suite:
```bash
python backend/tests/test_multicurrency.py
```

Run frontend linting and type check:
```bash
cd frontend
npm run lint
npm run build
```

---

## 🗺️ Roadmap

- [x] Initial luxury brand aesthetic & UI redesign (Rose Milk Pink theme)
- [x] Size variant support for fashion apparel (`XS`-`XXXL`)
- [x] Curated jewelry & accessory categories
- [x] Global multi-currency conversion engine (8 core currencies)
- [x] International shipping zone estimation
- [x] Product deletion & catalog management
- [ ] Production Stripe & Razorpay live webhook fulfillment
- [ ] Email notifications (Order confirmation & shipping tracking)
- [ ] Cloud deployment (AWS / Render / Vercel)

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
