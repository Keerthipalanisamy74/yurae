import sys
from pathlib import Path

# Ensure backend directory is in sys.path
backend_dir = Path(__file__).resolve().parent.parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from sqlalchemy.orm import Session
from app.database.session import SessionLocal, engine, Base
import app.models.models  # Register all models with Base.metadata
from app.models.models import User, Category, Product, ProductImage, ProductVariant, Coupon, Review, Cart, Address
from app.core.security import get_password_hash
from datetime import datetime, timedelta

def seed_db():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # 1. Admin User
        admin = db.query(User).filter(User.email == "admin@yuraebeauty.com").first()
        if not admin:
            admin = User(
                first_name="Yurae",
                last_name="Admin",
                email="admin@yuraebeauty.com",
                phone="+91 9876543210",
                password_hash=get_password_hash("Admin@123"),
                role="ADMIN",
                is_active=True
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
            print("Admin user created: admin@yuraebeauty.com / Admin@123")

        # 2. Demo Customer User
        customer = db.query(User).filter(User.email == "customer@yuraebeauty.com").first()
        if not customer:
            customer = User(
                first_name="Elena",
                last_name="Rao",
                email="customer@yuraebeauty.com",
                phone="+91 9812345678",
                password_hash=get_password_hash("Customer@123"),
                role="CUSTOMER",
                is_active=True
            )
            db.add(customer)
            db.commit()
            db.refresh(customer)

            # Customer Cart & Default Address
            cart = Cart(user_id=customer.id)
            db.add(cart)
            addr = Address(
                user_id=customer.id,
                name="Elena Rao",
                phone="+91 9812345678",
                address_line1="42 Bloom Avenue, Jubilee Hills",
                address_line2="Phase 3",
                city="Hyderabad",
                state="Telangana",
                postal_code="500033",
                country="India",
                is_default=True
            )
            db.add(addr)
            db.commit()
            print("Customer user created: customer@yuraebeauty.com / Customer@123")

        # 3. Categories
        cat_skincare = db.query(Category).filter(Category.slug == "skincare").first()
        if not cat_skincare:
            cat_skincare = Category(
                name="Skincare",
                slug="skincare",
                description="The hero collection. Pure Korean-inspired botanical formulations for timeless radiant skin.",
                image="https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1000&q=80"
            )
            db.add(cat_skincare)

        cat_fashion = db.query(Category).filter(Category.slug == "fashion").first()
        if not cat_fashion:
            cat_fashion = Category(
                name="Fashion",
                slug="fashion",
                description="Effortless modern femininity. Silks, soft linens, and tailored minimal silhouette dresses.",
                image="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1000&q=80"
            )
            db.add(cat_fashion)

        cat_accessories = db.query(Category).filter(Category.slug == "accessories").first()
        if not cat_accessories:
            cat_accessories = Category(
                name="Accessories",
                slug="accessories",
                description="Complete your signature look. Hand-crafted pearl earrings, silk scrunchies, and minimal gold jewelry.",
                image="https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1000&q=80"
            )
            db.add(cat_accessories)

        db.commit()
        db.refresh(cat_skincare)
        db.refresh(cat_fashion)
        db.refresh(cat_accessories)

        # 4. Seed Products
        if db.query(Product).count() == 0:
            products_data = [
                # SKINCARE PRODUCTS
                {
                    "category_id": cat_skincare.id,
                    "name": "Centella Gentle Calming Cleanser",
                    "slug": "centella-gentle-calming-cleanser",
                    "description": "An ultra-gentle, low-pH foaming cleanser enriched with 84% Centella Asiatica Extract from Madagascar. It melts away impurities, excess sebum, and makeup while restoring skin barrier hydration.",
                    "short_description": "Low-pH soothing foam cleanser with Centella Asiatica extract.",
                    "price": 1290.0,
                    "sale_price": 1090.0,
                    "stock_quantity": 45,
                    "sku": "YUR-SK-001",
                    "brand": "Yurae Beauty",
                    "weight": "150ml",
                    "ingredients": "Centella Asiatica Extract (84%), Glycerin, Sodium Cocoyl Isethionate, Water, Sodium Methyl Cocoyl Taurate, Coco-Betaine, Centella Leaf Water, Panthenol, Hyaluronic Acid",
                    "how_to_use": "Dispense a moderate amount onto wet hands, lather into rich foam, gently massage over face in circular motions, and rinse thoroughly with lukewarm water.",
                    "skin_type": "Sensitive, Combination, Normal",
                    "status": "ACTIVE",
                    "featured": True,
                    "images": [
                        "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1000&q=80",
                        "https://images.unsplash.com/photo-1608248597560-8488e530b192?auto=format&fit=crop&w=1000&q=80"
                    ]
                },
                {
                    "category_id": cat_skincare.id,
                    "name": "Niacinamide Glow Hydrating Serum",
                    "slug": "niacinamide-glow-hydrating-serum",
                    "description": "Our signature elixir featuring 10% Niacinamide and 2% Hyaluronic Acid. Designed to refine pore appearance, brighten hyperpigmentation, and lock in glass-skin moisture.",
                    "short_description": "Brightening glass-skin serum with 10% Niacinamide.",
                    "price": 1850.0,
                    "sale_price": 1590.0,
                    "stock_quantity": 60,
                    "sku": "YUR-SK-002",
                    "brand": "Yurae Beauty",
                    "weight": "50ml",
                    "ingredients": "Niacinamide (10%), Hyaluronic Acid (2%), Zinc PCA, Centella Extract, Ceramide NP, Adenosine, Sea Buckthorn Water",
                    "how_to_use": "Apply 3-4 drops onto freshly cleansed and toned skin morning and night. Gently pat until fully absorbed before layering moisturizer.",
                    "skin_type": "Oily, Dry, Combination, Sensitive, Normal",
                    "status": "ACTIVE",
                    "featured": True,
                    "images": [
                        "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1000&q=80",
                        "https://images.unsplash.com/photo-1608248597560-8488e530b192?auto=format&fit=crop&w=1000&q=80"
                    ]
                },
                {
                    "category_id": cat_skincare.id,
                    "name": "Radiant Vitamin C Antioxidant Serum",
                    "slug": "radiant-vitamin-c-antioxidant-serum",
                    "description": "Stabilized 15% Pure L-Ascorbic Acid infused with Ferulic Acid and Vitamin E. Shield against urban oxidative stress while revealing an ethereal, youthful radiance.",
                    "short_description": "Potent antioxidant vitamin C treatment for luminous tone.",
                    "price": 2100.0,
                    "sale_price": 1890.0,
                    "stock_quantity": 30,
                    "sku": "YUR-SK-003",
                    "brand": "Yurae Beauty",
                    "weight": "30ml",
                    "ingredients": "L-Ascorbic Acid (15%), Ferulic Acid (0.5%), Tocopherol (Vitamin E), Green Tea Extract, Sodium Hyaluronate",
                    "how_to_use": "Smooth 4 drops over dry face each morning. Follow immediately with Yurae Daily Sunscreen.",
                    "skin_type": "Dry, Combination, Normal",
                    "status": "ACTIVE",
                    "featured": True,
                    "images": [
                        "https://images.unsplash.com/photo-1608248597560-8488e530b192?auto=format&fit=crop&w=1000&q=80",
                        "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1000&q=80"
                    ]
                },
                {
                    "category_id": cat_skincare.id,
                    "name": "Ceramide Velvet Daily Moisturizer",
                    "slug": "ceramide-velvet-daily-moisturizer",
                    "description": "Rich yet silky cloud cream fortified with 5 essential ceramides, squalane, and oat extract. Delivers 72-hour moisture lock and reinforces damaged lipid barriers.",
                    "short_description": "Barrier repair cream with 5 Ceramides & Squalane.",
                    "price": 1690.0,
                    "sale_price": 1450.0,
                    "stock_quantity": 50,
                    "sku": "YUR-SK-004",
                    "brand": "Yurae Beauty",
                    "weight": "75ml",
                    "ingredients": "Ceramide NP, Ceramide AP, Ceramide EOP, Olive Squalane, Oat Kernel Extract, Shea Butter, Allantoin",
                    "how_to_use": "Smooth over face and neck as the final step of your evening ritual, or before sunscreen in the morning.",
                    "skin_type": "Dry, Sensitive, Normal",
                    "status": "ACTIVE",
                    "featured": True,
                    "images": [
                        "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=1000&q=80",
                        "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1000&q=80"
                    ]
                },
                {
                    "category_id": cat_skincare.id,
                    "name": "Invisible Shield Sunscreen SPF50+ PA++++",
                    "slug": "invisible-shield-sunscreen-spf50",
                    "description": "Featherlight, zero-white-cast moisturizing sun fluid with modern photostable filters and heartleaf extract to soothe UV-induced redness.",
                    "short_description": "Weightless broad-spectrum SPF 50+ hydrating sun fluid.",
                    "price": 1450.0,
                    "sale_price": 1250.0,
                    "stock_quantity": 80,
                    "sku": "YUR-SK-005",
                    "brand": "Yurae Beauty",
                    "weight": "50ml",
                    "ingredients": "Houttuynia Cordata Extract, Uvinul A Plus, Tinosorb S, Niacinamide, Glycerin, Adenosine",
                    "how_to_use": "Apply generously 15 minutes prior to sun exposure. Reapply every 2 hours during outdoor activity.",
                    "skin_type": "Oily, Dry, Combination, Sensitive, Normal",
                    "status": "ACTIVE",
                    "featured": True,
                    "images": [
                        "https://images.unsplash.com/photo-1567928269937-ae81d9f82638?auto=format&fit=crop&w=1000&q=80",
                        "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=1000&q=80"
                    ]
                },
                # FASHION PRODUCTS
                {
                    "category_id": cat_fashion.id,
                    "name": "Aura Silk Midi Wrap Dress",
                    "slug": "aura-silk-midi-wrap-dress",
                    "description": "Crafted from 100% pure Mulberry silk in champagne gold. Features delicate waist ties, flutter sleeves, and a flattering subtle asymmetrical slit.",
                    "short_description": "Pure Mulberry silk wrapped midi dress in champagne gold.",
                    "price": 6490.0,
                    "sale_price": 5890.0,
                    "stock_quantity": 15,
                    "sku": "YUR-FA-001",
                    "brand": "Yurae Atelier",
                    "weight": "350g",
                    "ingredients": "100% Mulberry Silk",
                    "how_to_use": "Dry clean or gentle hand wash cold with silk detergent.",
                    "skin_type": "All",
                    "status": "ACTIVE",
                    "featured": True,
                    "images": [
                        "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=1000&q=80",
                        "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1000&q=80"
                    ]
                },
                {
                    "category_id": cat_fashion.id,
                    "name": "Linen Blossom Oversized Shirt",
                    "slug": "linen-blossom-oversized-shirt",
                    "description": "Breathable French flax linen shirt in soft ivory. Designed for effortless resort layering or crisp everyday elegance.",
                    "short_description": "Relaxed French linen button-down shirt in ivory.",
                    "price": 3200.0,
                    "sale_price": 2850.0,
                    "stock_quantity": 25,
                    "sku": "YUR-FA-002",
                    "brand": "Yurae Atelier",
                    "weight": "280g",
                    "ingredients": "100% French Linen",
                    "how_to_use": "Machine wash cold on gentle cycle.",
                    "skin_type": "All",
                    "status": "ACTIVE",
                    "featured": False,
                    "images": [
                        "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=1000&q=80",
                        "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=1000&q=80"
                    ]
                },
                # ACCESSORIES PRODUCTS
                {
                    "category_id": cat_accessories.id,
                    "name": "Ethereal Freshwater Pearl Earrings",
                    "slug": "ethereal-freshwater-pearl-earrings",
                    "description": "Hand-selected baroque freshwater pearls suspended from 18k gold-plated sterling silver hoops.",
                    "short_description": "18k gold vermeil hoops with natural baroque pearls.",
                    "price": 2490.0,
                    "sale_price": 2190.0,
                    "stock_quantity": 20,
                    "sku": "YUR-AC-001",
                    "brand": "Yurae Jewelry",
                    "weight": "15g",
                    "ingredients": "Natural Freshwater Pearl, 18k Gold Plated 925 Sterling Silver",
                    "how_to_use": "Store in soft microfibre pouch provided. Avoid direct spraying of perfume.",
                    "skin_type": "All",
                    "status": "ACTIVE",
                    "featured": True,
                    "images": [
                        "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1000&q=80",
                        "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1000&q=80"
                    ]
                },
                {
                    "category_id": cat_accessories.id,
                    "name": "Silk Cloud Hair Scrunchie Set",
                    "slug": "silk-cloud-hair-scrunchie-set",
                    "description": "Trio of 22 Momme pure Mulberry silk scrunchies in Champagne, Cream, and Soft Rose. Protects hair strands from breakage and creasing.",
                    "short_description": "Set of 3 Mulberry silk hair ties.",
                    "price": 1200.0,
                    "sale_price": 990.0,
                    "stock_quantity": 40,
                    "sku": "YUR-AC-002",
                    "brand": "Yurae Accessories",
                    "weight": "50g",
                    "ingredients": "100% 22 Momme Mulberry Silk",
                    "how_to_use": "Hand wash cold.",
                    "skin_type": "All",
                    "status": "ACTIVE",
                    "featured": False,
                    "images": [
                        "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1000&q=80",
                        "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1000&q=80"
                    ]
                }
            ]

            for p_data in products_data:
                imgs = p_data.pop("images")
                product = Product(**p_data)
                db.add(product)
                db.commit()
                db.refresh(product)

                for idx, img_url in enumerate(imgs):
                    p_img = ProductImage(product_id=product.id, image_url=img_url, sort_order=idx)
                    db.add(p_img)

                # Add sample variants for Skincare & Fashion
                if product.category_id == cat_skincare.id:
                    v1 = ProductVariant(product_id=product.id, variant_name="Size", variant_value="Full Size", additional_price=0.0, stock_quantity=30)
                    v2 = ProductVariant(product_id=product.id, variant_name="Size", variant_value="Travel Size (30ml)", additional_price=-400.0, stock_quantity=15)
                    db.add_all([v1, v2])
                elif product.category_id == cat_fashion.id:
                    v1 = ProductVariant(product_id=product.id, variant_name="Size", variant_value="Small (S)", additional_price=0.0, stock_quantity=5)
                    v2 = ProductVariant(product_id=product.id, variant_name="Size", variant_value="Medium (M)", additional_price=0.0, stock_quantity=10)
                    v3 = ProductVariant(product_id=product.id, variant_name="Size", variant_value="Large (L)", additional_price=0.0, stock_quantity=5)
                    db.add_all([v1, v2, v3])

            db.commit()
            print("Products seeded successfully.")

        # 5. Coupons
        if db.query(Coupon).count() == 0:
            c1 = Coupon(code="YURAE10", discount_type="PERCENTAGE", discount_value=10.0, minimum_order_amount=1000.0, active=True)
            c2 = Coupon(code="SKINCARE20", discount_type="PERCENTAGE", discount_value=20.0, minimum_order_amount=2000.0, active=True)
            c3 = Coupon(code="WELCOME100", discount_type="FIXED", discount_value=100.0, minimum_order_amount=500.0, active=True)
            db.add_all([c1, c2, c3])
            db.commit()
            print("Coupons seeded successfully.")

        # 6. Sample Reviews
        if db.query(Review).count() == 0:
            first_prod = db.query(Product).first()
            if first_prod and customer:
                r1 = Review(
                    user_id=customer.id,
                    product_id=first_prod.id,
                    rating=5,
                    review="This cleanser completely transformed my skin routine! Super gentle, doesn't strip my skin barrier at all. High recommend!",
                    is_approved=True
                )
                db.add(r1)
                db.commit()
                print("Sample review seeded.")

        print("Database seeding completed successfully.")

    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
