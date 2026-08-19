from sqlalchemy.orm import Session
from app.database.session import SessionLocal
from app.models.models import Product, ProductImage, ProductVariant, CartItem, Wishlist, Review, OrderItem

def clear_all_products():
    db: Session = SessionLocal()
    try:
        # Delete dependent items first
        db.query(CartItem).delete()
        db.query(Wishlist).delete()
        db.query(Review).delete()
        db.query(OrderItem).delete()
        db.query(ProductVariant).delete()
        db.query(ProductImage).delete()
        
        # Delete all products
        num_deleted = db.query(Product).delete()
        db.commit()
        print(f"Successfully deleted {num_deleted} products from the database.")
    except Exception as e:
        db.rollback()
        print(f"Error deleting products: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    clear_all_products()
