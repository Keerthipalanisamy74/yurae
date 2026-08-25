from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import User, Address, Cart, Order
from app.schemas.schemas import (
    UserRegister, UserLogin, UserResponse, Token,
    ForgotPasswordRequest, VerifyOtpRequest, ResetPasswordRequest, ChangePasswordRequest,
    AddressCreate, AddressUpdate, AddressResponse
)
from app.core.security import get_password_hash, verify_password, create_access_token
from app.api.deps import get_current_user
from typing import List

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserRegister, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    hashed_pwd = get_password_hash(user_in.password)
    new_user = User(
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        email=user_in.email.lower(),
        phone=user_in.phone,
        password_hash=hashed_pwd,
        role="CUSTOMER"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create associated cart for new user
    cart = Cart(user_id=new_user.id)
    db.add(cart)
    db.commit()

    token = create_access_token(subject=new_user.id, role=new_user.role)
    return Token(access_token=token, token_type="bearer", user=new_user)

@router.post("/login", response_model=Token)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    clean_email = user_in.email.strip().lower()
    clean_password = user_in.password.strip()
    user = db.query(User).filter(User.email == clean_email).first()
    if not user or not verify_password(clean_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account disabled. Please contact support."
        )

    token = create_access_token(subject=user.id, role=user.role)
    return Token(access_token=token, token_type="bearer", user=user)

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/profile", response_model=UserResponse)
def update_profile(
    first_name: str | None = None,
    last_name: str | None = None,
    phone: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if first_name:
        current_user.first_name = first_name
    if last_name:
        current_user.last_name = last_name
    if phone:
        current_user.phone = phone
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user:
        # Generic message to avoid email enumeration
        return {"message": "If that email is registered with Yurae, a verification code has been sent."}
    
    import random
    from datetime import datetime, timedelta
    from app.services.email_service import EmailService

    # Generate 6-digit numeric OTP
    otp = f"{random.randint(100000, 999999)}"
    user.reset_otp = otp
    user.reset_otp_expires_at = datetime.utcnow() + timedelta(minutes=15)
    db.commit()

    # Dispatch branded security email
    EmailService.send_password_reset_otp(user.email, user.first_name, otp)

    return {
        "message": "Verification code has been sent to your email address.",
        "expires_in_minutes": 15,
        "dev_otp": otp  # Included for seamless testing in dev environments
    }

@router.post("/verify-reset-otp")
def verify_reset_otp(req: VerifyOtpRequest, db: Session = Depends(get_db)):
    from datetime import datetime
    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user or not user.reset_otp or user.reset_otp != req.otp.strip():
        raise HTTPException(status_code=400, detail="Invalid verification code.")
    
    if user.reset_otp_expires_at and user.reset_otp_expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Verification code has expired. Please request a new code.")
    
    return {"message": "Verification code is valid. You may now choose a new password."}

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    from datetime import datetime
    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user or not user.reset_otp or user.reset_otp != req.otp.strip():
        raise HTTPException(status_code=400, detail="Invalid or expired verification code.")
    
    if user.reset_otp_expires_at and user.reset_otp_expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Verification code has expired. Please request a new code.")
    
    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters.")

    user.password_hash = get_password_hash(req.new_password)
    user.reset_otp = None
    user.reset_otp_expires_at = None
    db.commit()

    return {"message": "Your password has been successfully reset. You can now login with your new password."}

@router.post("/change-password")
def change_password(
    req: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(req.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password does not match."
        )
    if len(req.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters."
        )
    current_user.password_hash = get_password_hash(req.new_password)
    db.commit()
    return {"message": "Password changed successfully."}

# --- Address Endpoints ---
@router.get("/addresses", response_model=List[AddressResponse])
def get_user_addresses(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Address).filter(Address.user_id == current_user.id).order_by(Address.is_default.desc(), Address.id.desc()).all()

@router.post("/addresses", response_model=AddressResponse)
def create_user_address(
    addr_in: AddressCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    existing_count = db.query(Address).filter(Address.user_id == current_user.id).count()
    should_be_default = addr_in.is_default or (existing_count == 0)

    if should_be_default:
        db.query(Address).filter(Address.user_id == current_user.id).update({"is_default": False})
    
    new_addr = Address(
        user_id=current_user.id,
        address_type=addr_in.address_type or "Home",
        name=addr_in.name,
        phone=addr_in.phone,
        address_line1=addr_in.address_line1,
        address_line2=addr_in.address_line2,
        building_or_flat=addr_in.building_or_flat,
        landmark=addr_in.landmark,
        city=addr_in.city,
        state=addr_in.state,
        postal_code=addr_in.postal_code,
        country=addr_in.country or "India",
        is_default=should_be_default
    )
    db.add(new_addr)
    db.commit()
    db.refresh(new_addr)
    return new_addr

@router.put("/addresses/{address_id}", response_model=AddressResponse)
def update_user_address(
    address_id: int,
    addr_in: AddressUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    addr = db.query(Address).filter(Address.id == address_id, Address.user_id == current_user.id).first()
    if not addr:
        raise HTTPException(status_code=404, detail="Address not found")

    update_data = addr_in.model_dump(exclude_unset=True) if hasattr(addr_in, "model_dump") else addr_in.dict(exclude_unset=True)

    if update_data.get("is_default"):
        db.query(Address).filter(Address.user_id == current_user.id).update({"is_default": False})

    for field, val in update_data.items():
        setattr(addr, field, val)

    db.commit()
    db.refresh(addr)
    return addr

@router.put("/addresses/{address_id}/set-default", response_model=AddressResponse)
def set_default_address(
    address_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    addr = db.query(Address).filter(Address.id == address_id, Address.user_id == current_user.id).first()
    if not addr:
        raise HTTPException(status_code=404, detail="Address not found")

    # Unset all other addresses
    db.query(Address).filter(Address.user_id == current_user.id).update({"is_default": False})
    addr.is_default = True
    db.commit()
    db.refresh(addr)
    return addr

@router.delete("/addresses/{address_id}")
def delete_user_address(
    address_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    addr = db.query(Address).filter(Address.id == address_id, Address.user_id == current_user.id).first()
    if not addr:
        raise HTTPException(status_code=404, detail="Address not found")
    was_default = addr.is_default

    # Unlink past orders referencing this address to prevent FK integrity errors
    db.query(Order).filter(Order.address_id == addr.id).update({"address_id": None})
    
    db.delete(addr)
    db.commit()

    # If the deleted address was default, promote the newest remaining address to default
    if was_default:
        next_addr = db.query(Address).filter(Address.user_id == current_user.id).order_by(Address.id.desc()).first()
        if next_addr:
            next_addr.is_default = True
            db.commit()

    return {"message": "Address deleted successfully"}
