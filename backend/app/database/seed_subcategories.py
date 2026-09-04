import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from sqlalchemy.orm import Session
from app.database.session import SessionLocal, engine, Base
import app.models.models
from app.models.models import Category, Subcategory, Product

def seed_subcategories():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # Hierarchical structure: Category Slug -> Parent Groups -> Child Nested Subcategories
        hierarchy = {
            "skincare": [
                {
                    "name": "Skincare",
                    "slug": "skincare-group",
                    "description": "Facial skincare, serums, cleansers, and treatments",
                    "order": 1,
                    "children": [
                        {"name": "Face Wash / Cleansers", "slug": "face-wash-cleansers", "order": 1},
                        {"name": "Moisturizers & Creams", "slug": "moisturizers-creams", "order": 2},
                        {"name": "Serums & Ampoules", "slug": "serums-ampoules", "order": 3},
                        {"name": "Toners & Essences", "slug": "toners-essences", "order": 4},
                        {"name": "Sunscreens & SPF", "slug": "sunscreens-spf", "order": 5},
                        {"name": "Face Masks & Peels", "slug": "face-masks-peels", "order": 6},
                        {"name": "Lip Care", "slug": "lip-care", "order": 7},
                        {"name": "Eye Creams", "slug": "eye-creams", "order": 8},
                    ]
                },
                {
                    "name": "Bodycare",
                    "slug": "bodycare-group",
                    "description": "Luxurious botanical body washes, lotions, scrubs, and body oils",
                    "order": 2,
                    "children": [
                        {"name": "Body Wash & Cleansers", "slug": "body-wash-cleansers", "order": 1},
                        {"name": "Body Lotions & Creams", "slug": "body-lotions-creams", "order": 2},
                        {"name": "Body Scrubs & Exfoliators", "slug": "body-scrubs-exfoliators", "order": 3},
                        {"name": "Body Oils & Butters", "slug": "body-oils-butters", "order": 4},
                        {"name": "Hand & Foot Care", "slug": "hand-foot-care", "order": 5},
                    ]
                },
                {
                    "name": "Haircare",
                    "slug": "haircare-group",
                    "description": "Scalp rituals, nourishing botanical shampoos and hair serums",
                    "order": 3,
                    "children": [
                        {"name": "Shampoos & Scalp Cleansers", "slug": "shampoos-scalp", "order": 1},
                        {"name": "Conditioners & Hair Masks", "slug": "conditioners-masks", "order": 2},
                        {"name": "Hair Oils & Elixirs", "slug": "hair-oils-elixirs", "order": 3},
                    ]
                }
            ],
            "accessories": [
                {
                    "name": "Fine Jewelry",
                    "slug": "fine-jewelry",
                    "description": "18k gold vermeil, sterling silver & pearl pieces",
                    "order": 1,
                    "children": [
                        {"name": "Rings", "slug": "rings", "order": 1},
                        {"name": "Necklaces & Pendants", "slug": "necklaces-pendants", "order": 2},
                        {"name": "Earrings & Studs", "slug": "earrings-studs", "order": 3},
                        {"name": "Bracelets & Bangles", "slug": "bracelets-bangles", "order": 4},
                        {"name": "Anklets", "slug": "anklets", "order": 5},
                    ]
                },
                {
                    "name": "Bags & Leather",
                    "slug": "bags-leather",
                    "description": "Handcrafted artisanal bags and evening clutches",
                    "order": 2,
                    "children": [
                        {"name": "Handbags & Totes", "slug": "handbags-totes", "order": 1},
                        {"name": "Clutches & Evening Pouches", "slug": "clutches-pouches", "order": 2},
                        {"name": "Crossbody Bags", "slug": "crossbody-bags", "order": 3},
                    ]
                },
                {
                    "name": "Timepieces",
                    "slug": "timepieces",
                    "description": "Minimalist luxury analog watches",
                    "order": 3,
                    "children": [
                        {"name": "Classic Mesh Watches", "slug": "mesh-watches", "order": 1},
                        {"name": "Leather Strap Watches", "slug": "leather-watches", "order": 2},
                    ]
                },
                {
                    "name": "Hair & Accents",
                    "slug": "hair-accents",
                    "description": "Pure silk scrunchies and luxury pearl clips",
                    "order": 4,
                    "children": [
                        {"name": "Silk Scrunchies", "slug": "silk-scrunchies", "order": 1},
                        {"name": "Pearl Hairpins & Clips", "slug": "pearl-hairpins", "order": 2},
                    ]
                }
            ],
            "fashion": [
                {
                    "name": "Apparel & Dresses",
                    "slug": "apparel-dresses",
                    "description": "Contemporary feminine silhouettes, dresses and kurtis",
                    "order": 1,
                    "children": [
                        {"name": "Maxi & Midi Dresses", "slug": "maxi-midi-dresses", "order": 1},
                        {"name": "Kurtis & Ethnic Wear", "slug": "kurtis-ethnic-wear", "order": 2},
                        {"name": "Tops & Blouses", "slug": "tops-blouses", "order": 3},
                        {"name": "Skirts & Bottoms", "slug": "skirts-bottoms", "order": 4},
                        {"name": "Pants & Trousers", "slug": "pants-trousers", "order": 5},
                    ]
                },
                {
                    "name": "Silks & Loungewear",
                    "slug": "silks-loungewear-group",
                    "description": "100% Mulberry silk robes and luxury sleep sets",
                    "order": 2,
                    "children": [
                        {"name": "Silk Robes & Kimonos", "slug": "silk-robes-kimonos", "order": 1},
                        {"name": "Nightwear & Sleep Sets", "slug": "nightwear-sleep-sets", "order": 2},
                        {"name": "Co-ord Sets", "slug": "coord-sets", "order": 3},
                    ]
                }
            ]
        }

        # Clean up legacy flat subcategories not in our hierarchy
        valid_slugs = []
        for cat_slug, groups in hierarchy.items():
            for g in groups:
                valid_slugs.append(g["slug"])
                for c in g.get("children", []):
                    valid_slugs.append(c["slug"])

        legacy_subs = db.query(Subcategory).filter(~Subcategory.slug.in_(valid_slugs)).all()
        for leg in legacy_subs:
            db.query(Product).filter(Product.subcategory_id == leg.id).update({"subcategory_id": None}, synchronize_session=False)
            db.delete(leg)
        db.commit()

        created_parents = 0
        created_children = 0

        for cat_slug, groups in hierarchy.items():
            cat = db.query(Category).filter(Category.slug == cat_slug).first()
            if not cat:
                continue

            for g_data in groups:
                # Find or create Parent Subcategory
                parent_sub = db.query(Subcategory).filter(
                    Subcategory.category_id == cat.id,
                    Subcategory.slug == g_data["slug"]
                ).first()

                if not parent_sub:
                    parent_sub = Subcategory(
                        category_id=cat.id,
                        parent_id=None,
                        name=g_data["name"],
                        slug=g_data["slug"],
                        description=g_data.get("description"),
                        display_order=g_data.get("order", 1),
                    )
                    db.add(parent_sub)
                    db.commit()
                    db.refresh(parent_sub)
                    created_parents += 1
                else:
                    parent_sub.name = g_data["name"]
                    parent_sub.parent_id = None
                    parent_sub.display_order = g_data.get("order", 1)
                    db.commit()

                # Find or create Children
                for c_data in g_data.get("children", []):
                    child_sub = db.query(Subcategory).filter(
                        Subcategory.category_id == cat.id,
                        Subcategory.slug == c_data["slug"]
                    ).first()

                    if not child_sub:
                        child_sub = Subcategory(
                            category_id=cat.id,
                            parent_id=parent_sub.id,
                            name=c_data["name"],
                            slug=c_data["slug"],
                            display_order=c_data.get("order", 1),
                        )
                        db.add(child_sub)
                        created_children += 1
                    else:
                        child_sub.name = c_data["name"]
                        child_sub.parent_id = parent_sub.id
                        child_sub.display_order = c_data.get("order", 1)

                db.commit()

        print(f"Hierarchical seeding complete! Cleaned up {len(legacy_subs)} legacy subcategories. Created {created_parents} parent groups and {created_children} nested children.")

        # Re-link existing products to their closest matching subcategories
        products = db.query(Product).all()
        for p in products:
            name_lower = p.name.lower()
            desc_lower = (p.description or "").lower()

            matched = None
            if any(k in name_lower for k in ["cleanser", "wash", "soap", "foam"]):
                matched = db.query(Subcategory).filter(Subcategory.slug == "face-wash-cleansers").first()
            elif any(k in name_lower for k in ["serum", "niacinamide", "vitamin c", "ampoule"]):
                matched = db.query(Subcategory).filter(Subcategory.slug == "serums-ampoules").first()
            elif any(k in name_lower for k in ["cream", "moisturizer", "ceramide", "lotion"]):
                matched = db.query(Subcategory).filter(Subcategory.slug == "moisturizers-creams").first()
            elif any(k in name_lower for k in ["ring"]):
                matched = db.query(Subcategory).filter(Subcategory.slug == "rings").first()
            elif any(k in name_lower for k in ["necklace", "chain", "pendant", "choker"]):
                matched = db.query(Subcategory).filter(Subcategory.slug == "necklaces-pendants").first()
            elif any(k in name_lower for k in ["bag", "tote", "pouch", "clutch"]):
                matched = db.query(Subcategory).filter(Subcategory.slug == "handbags-totes").first()
            elif any(k in name_lower for k in ["watch"]):
                matched = db.query(Subcategory).filter(Subcategory.slug == "mesh-watches").first()
            elif any(k in name_lower for k in ["earring", "stud", "hoop"]):
                matched = db.query(Subcategory).filter(Subcategory.slug == "earrings-studs").first()
            elif any(k in name_lower for k in ["dress", "gown"]):
                matched = db.query(Subcategory).filter(Subcategory.slug == "maxi-midi-dresses").first()
            elif any(k in name_lower for k in ["kurti", "tunic"]):
                matched = db.query(Subcategory).filter(Subcategory.slug == "kurtis-ethnic-wear").first()
            elif any(k in name_lower for k in ["silk", "robe", "lounge"]):
                matched = db.query(Subcategory).filter(Subcategory.slug == "silk-robes-kimonos").first()

            if matched:
                p.subcategory_id = matched.id

        db.commit()
        print("Updated product links with hierarchical subcategories.")
    except Exception as e:
        db.rollback()
        print("Seeding error:", e)
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_subcategories()
