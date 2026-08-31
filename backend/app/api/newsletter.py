import re
import os
import json
from datetime import datetime
from typing import List, Optional
from pathlib import Path
from pydantic import BaseModel, EmailStr
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.models import User
from app.api.deps import get_current_admin
from app.services.email_service import EmailService

router = APIRouter(prefix="/newsletter", tags=["Newsletter & Community Subscribers"])

SUBSCRIBERS_FILE = Path(__file__).resolve().parent.parent / "database" / "newsletter_subscribers.json"

def _load_subscribers() -> List[dict]:
    if SUBSCRIBERS_FILE.exists():
        try:
            with open(SUBSCRIBERS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []
    return []

def _save_subscribers(data: List[dict]):
    SUBSCRIBERS_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(SUBSCRIBERS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

class SubscribeRequest(BaseModel):
    email: str

class SubscribeResponse(BaseModel):
    success: bool
    message: str
    coupon_code: str
    email: str
    is_new: bool

@router.post("/subscribe", response_model=SubscribeResponse, status_code=status.HTTP_200_OK)
def subscribe_to_newsletter(payload: SubscribeRequest, db: Session = Depends(get_db)):
    """
    Public endpoint for visitors to subscribe to Yurae Beauty newsletter,
    unlocking an instant 10% privilege discount voucher (WELCOME10) and welcome email.
    """
    clean_email = payload.email.strip().lower()
    
    if not clean_email or not re.match(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$", clean_email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please enter a valid email address."
        )

    subscribers = _load_subscribers()
    existing = next((s for s in subscribers if s.get("email") == clean_email), None)
    
    is_new = False
    if not existing:
        is_new = True
        subscribers.append({
            "email": clean_email,
            "subscribed_at": datetime.utcnow().isoformat(),
            "status": "ACTIVE",
            "source": "FOOTER_COMMUNITY_BOX",
            "coupon_granted": "WELCOME10"
        })
        _save_subscribers(subscribers)

    # Dispatch transactional welcome email via EmailService
    try:
        html_body = f"""
        <div style="font-family: 'Playfair Display', Georgia, serif; max-width: 600px; margin: 0 auto; background: #FFF9FB; border: 1px solid #F1BCCE; border-radius: 24px; padding: 40px; color: #111111;">
            <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #D84B7E; font-size: 26px; margin: 0; letter-spacing: 2px;">YURAE BEAUTY</h1>
                <p style="text-transform: uppercase; font-size: 10px; letter-spacing: 3px; color: #8A1C47; margin-top: 4px;">The Origin of Skincare</p>
            </div>
            <h2 style="font-size: 20px; color: #111111; text-align: center;">Welcome to the Yurae Community</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #4A4A4A; text-align: center;">
                Thank you for joining our private circle. Experience ancient Korean botanical formulations crafted for luminous glass skin.
            </p>
            <div style="background: #FAF0F4; border: 1px dashed #D84B7E; border-radius: 16px; padding: 20px; text-align: center; margin: 30px 0;">
                <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #8A1C47; font-weight: bold; display: block;">Your 10% Welcome Privilege Code</span>
                <span style="font-size: 24px; font-family: monospace; font-weight: bold; color: #D84B7E; letter-spacing: 4px; display: block; margin-top: 6px;">WELCOME10</span>
                <span style="font-size: 12px; color: #666666; display: block; margin-top: 4px;">Apply during checkout for 10% off your entire first order.</span>
            </div>
            <div style="text-align: center; margin-top: 30px;">
                <a href="https://yuraebeauty.com/shop" style="background: #D84B7E; color: #FFFFFF; text-decoration: none; padding: 14px 32px; border-radius: 30px; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; display: inline-block;">Explore Collection</a>
            </div>
        </div>
        """
        EmailService.send_email_async(
            to_email=clean_email,
            subject="✨ Welcome to Yurae Beauty — Your 10% Privilege Code Inside",
            html_body=html_body,
            sender_type="marketing",
            template_name="NEWSLETTER_WELCOME",
            db=db
        )
    except Exception as e:
        pass

    return {
        "success": True,
        "message": "Welcome to the Yurae Beauty community! Your exclusive 10% privilege code is WELCOME10.",
        "coupon_code": "WELCOME10",
        "email": clean_email,
        "is_new": is_new
    }

@router.get("/subscribers")
def list_subscribers(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    [ADMIN] Retrieve all registered newsletter subscribers.
    """
    subscribers = _load_subscribers()
    return {
        "total_subscribers": len(subscribers),
        "subscribers": subscribers
    }
