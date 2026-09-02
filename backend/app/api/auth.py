from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import re
import socket
from datetime import datetime, timedelta
import random

from app.database.session import get_db
from app.models.models import User, Address, Cart, Order, EmailVerification
from app.schemas.schemas import (
    UserRegister, UserLogin, UserResponse, Token,
    SendRegistrationOtpRequest, VerifyRegistrationOtpRequest,
    ForgotPasswordRequest, VerifyOtpRequest, ResetPasswordRequest, ChangePasswordRequest,
    AddressCreate, AddressUpdate, AddressResponse
)
from app.core.security import get_password_hash, verify_password, create_access_token
from app.api.deps import get_current_user
from typing import List

router = APIRouter(prefix="/auth", tags=["Authentication"])

def verify_email_deliverability(email: str) -> tuple[bool, str]:
    """
    Validates email format and verifies that the domain really exists with active MX mail exchangers.
    """
    clean_email = email.strip().lower()
    if not clean_email or "@" not in clean_email:
        return False, "Please enter a valid email address."
    
    # 1. Strict regex format check
    pattern = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
    if not re.match(pattern, clean_email):
        return False, "The email address format is invalid."
    
    parts = clean_email.split("@")
    if len(parts) != 2:
        return False, "The email address format is invalid."
    
    local_part, domain = parts
    if not local_part or not domain or "." not in domain or len(domain) < 4:
        return False, "The email address does not exist. Please check your email."
    
    tld = domain.split(".")[-1]
    if len(tld) < 2 or not tld.isalpha():
        return False, "The email address does not exist. Please check your email."

    # Common domain typo detection
    common_typos = {
        "gmaill.com": "gmail.com",
        "gamil.com": "gmail.com",
        "gmial.com": "gmail.com",
        "gmailll.com": "gmail.com",
        "hotmial.com": "hotmail.com",
        "yaho.com": "yahoo.com",
        "outlok.com": "outlook.com",
        "gmaill.con": "gmail.com",
        "gmail.con": "gmail.com",
        "yahoo.con": "yahoo.com",
    }
    if domain in common_typos:
        return False, f"The email address does not exist. Did you mean @{common_typos[domain]}?"

    # 2. Strict MX (Mail Exchanger) DNS Resolution Check
    try:
        import dns.resolver
        resolver = dns.resolver.Resolver()
        resolver.timeout = 3.0
        resolver.lifetime = 3.0
        mx_records = resolver.resolve(domain, 'MX')
        if not mx_records or len(mx_records) == 0:
            return False, f"The email address does not exist. The domain '@{domain}' has no active mail server."
    except Exception as dns_err:
        err_str = str(dns_err)
        # Check NXDOMAIN or NoAnswer
        if "does not exist" in err_str or "NXDOMAIN" in err_str or "NoAnswer" in err_str or "NoNameservers" in err_str:
            return False, f"The email address does not exist. The domain '@{domain}' was not found."
        # Fallback socket lookup
        try:
            socket.gethostbyname(domain)
        except socket.gaierror:
            return False, f"The email address does not exist. The domain '@{domain}' was not found."
        except Exception:
            pass

    return True, ""

@router.post("/validate-email")
def validate_email_endpoint(data: dict, db: Session = Depends(get_db)):
    raw_email = (data.get("email") or "").strip().lower()
    if not raw_email:
        return {"valid": False, "message": "Please enter an email address."}
    
    is_valid, err_msg = verify_email_deliverability(raw_email)
    if not is_valid:
        return {"valid": False, "message": err_msg}
    
    existing_user = db.query(User).filter(User.email == raw_email).first()
    if existing_user:
        return {"valid": False, "message": "An account with this email address already exists. Please sign in."}
    
    return {"valid": True, "message": "Email is valid."}

@router.post("/send-registration-otp")
def send_registration_otp(req: SendRegistrationOtpRequest, db: Session = Depends(get_db)):
    clean_email = req.email.strip().lower()
    
    # 1. Deliverability & real domain existence verification
    is_valid, err_msg = verify_email_deliverability(clean_email)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=err_msg
        )
    
    # 2. Check if user already exists
    existing_user = db.query(User).filter(User.email == clean_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please sign in."
        )
    
    # 3. Password validation
    if len(req.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters."
        )
    
    from app.services.email_service import EmailService
    
    otp = f"{random.randint(100000, 999999)}"
    hashed_pwd = get_password_hash(req.password)
    expires_at = datetime.utcnow() + timedelta(minutes=15)
    
    # Check if pending verification exists
    existing_verif = db.query(EmailVerification).filter(
        EmailVerification.email == clean_email,
        EmailVerification.is_verified == False
    ).first()
    
    if existing_verif:
        existing_verif.otp_code = otp
        existing_verif.first_name = req.first_name.strip()
        existing_verif.last_name = req.last_name.strip()
        existing_verif.phone = req.phone.strip() if req.phone else None
        existing_verif.password_hash = hashed_pwd
        existing_verif.expires_at = expires_at
    else:
        new_verif = EmailVerification(
            email=clean_email,
            otp_code=otp,
            first_name=req.first_name.strip(),
            last_name=req.last_name.strip(),
            phone=req.phone.strip() if req.phone else None,
            password_hash=hashed_pwd,
            expires_at=expires_at,
            is_verified=False
        )
        db.add(new_verif)
    
    db.commit()
    
    # Dispatch real-time branded verification email
    try:
        EmailService.send_otp_email(
            to_email=clean_email,
            first_name=req.first_name.strip(),
            otp=otp,
            purpose="Account Creation Verification",
            expires_minutes=15
        )
    except Exception as e:
        print(f"[EMAIL SEND ERROR] {e}")
    
    return {
        "success": True,
        "message": f"Verification code has been sent to your email ({clean_email}). Please check your inbox.",
        "expires_in_minutes": 15
    }

@router.post("/verify-registration-otp", response_model=Token, status_code=status.HTTP_201_CREATED)
def verify_registration_otp(req: VerifyRegistrationOtpRequest, db: Session = Depends(get_db)):
    clean_email = req.email.strip().lower()
    clean_otp = req.otp.strip()
    
    # Find matching verification record
    verif = db.query(EmailVerification).filter(
        EmailVerification.email == clean_email,
        EmailVerification.is_verified == False
    ).order_by(EmailVerification.created_at.desc()).first()
    
    if not verif or verif.otp_code != clean_otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code. Please check your email or request a new code."
        )
    
    if verif.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired. Please request a new code."
        )
    
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == clean_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please sign in."
        )
    
    # Mark verification as used
    verif.is_verified = True
    
    # Create the User
    new_user = User(
        first_name=verif.first_name,
        last_name=verif.last_name,
        email=verif.email,
        phone=verif.phone,
        password_hash=verif.password_hash,
        role="CUSTOMER",
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create associated cart
    cart = Cart(user_id=new_user.id)
    db.add(cart)
    db.commit()
    
    # Dispatch welcome email asynchronously
    try:
        from app.services.email_service import EmailService
        EmailService.send_welcome_email(new_user)
    except Exception:
        pass
    
    token = create_access_token(subject=new_user.id, role=new_user.role)
    return Token(access_token=token, token_type="bearer", user=new_user)

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserRegister, db: Session = Depends(get_db)):
    clean_email = user_in.email.strip().lower()
    
    # 1. Deliverability verification
    is_valid, err_msg = verify_email_deliverability(clean_email)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=err_msg
        )
        
    existing_user = db.query(User).filter(User.email == clean_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    hashed_pwd = get_password_hash(user_in.password)
    new_user = User(
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        email=clean_email,
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

    # Dispatch branded welcome email asynchronously
    try:
        from app.services.email_service import EmailService
        EmailService.send_welcome_email(new_user)
    except Exception as e:
        pass

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
        "expires_in_minutes": 15
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

    try:
        from app.services.email_service import EmailService
        EmailService.send_password_changed_email(user.email, user.first_name or "Valued Patron")
    except Exception:
        pass

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
