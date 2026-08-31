import os
import json
from pathlib import Path
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from app.api.deps import get_current_admin
from app.models.models import User

router = APIRouter(tags=["Marketing & Merchandising"])

CONFIG_FILE = Path(__file__).resolve().parent.parent / "database" / "marketing_campaigns.json"

class MarketingCampaignConfig(BaseModel):
    is_active: bool = True
    campaign_name: str = "Monsoon Radiance Glow"
    
    # Appearance & Colors
    color_theme: str = "blush" # 'blush', 'obsidian', 'gold', 'emerald', 'plum', 'sunset', 'pearl', 'custom'
    bg_gradient_from: str = "#D84B7E"
    bg_gradient_to: str = "#8A1C47"
    text_color: str = "#FFFFFF"
    accent_color: str = "#FFE0EB"
    btn_bg_color: str = "#FFFFFF"
    btn_text_color: str = "#D84B7E"
    
    # Pop-Up / Display Format
    popup_style: str = "TOP_TICKER" # 'TOP_TICKER', 'CENTER_MODAL', 'BOTTOM_PILL', 'FLOATING_CORNER', 'FULLSCREEN_TAKEOVER'
    
    # Publishing Targets & Rules
    target_pages: str = "ALL_PAGES" # 'ALL_PAGES', 'HOME_ONLY', 'SHOP_ONLY', 'PRODUCT_ONLY', 'CART_CHECKOUT'
    target_devices: str = "ALL_DEVICES" # 'ALL_DEVICES', 'DESKTOP_ONLY', 'MOBILE_ONLY'
    target_audience: str = "ALL_VISITORS" # 'ALL_VISITORS', 'NEW_VISITORS', 'LOGGED_IN'
    
    # Trigger & Frequency
    trigger_type: str = "ON_LOAD" # 'ON_LOAD', 'DELAY_3S', 'DELAY_7S', 'SCROLL_50'
    frequency: str = "EVERY_VISIT" # 'EVERY_VISIT', 'ONCE_PER_SESSION', 'ONCE_PER_DAY'
    
    # Copy & Conversion Media
    announcement_text: str = "✨ Complimentary Discovery Trio on all orders above ₹2,499 | Free Express Shipping across India"
    headline: str = "Unlock 15% OFF Your First Ritual"
    subheadline: str = "Experience Korea's pristine botanical actives formulated for luminous glass skin."
    coupon_code: Optional[str] = "WELCOME15"
    cta_label: str = "Claim Privilege"
    cta_url: str = "/shop"
    image_url: Optional[str] = "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80"
    show_countdown: bool = False
    countdown_end_date: Optional[str] = "2026-09-30"

DEFAULT_CONFIG: Dict[str, Any] = {
    "is_active": True,
    "campaign_name": "Artisanal Radiance Welcome Edit",
    "color_theme": "blush",
    "bg_gradient_from": "#D84B7E",
    "bg_gradient_to": "#8A1C47",
    "text_color": "#FFFFFF",
    "accent_color": "#FFE0EB",
    "btn_bg_color": "#FFFFFF",
    "btn_text_color": "#D84B7E",
    "popup_style": "TOP_TICKER",
    "target_pages": "ALL_PAGES",
    "target_devices": "ALL_DEVICES",
    "target_audience": "ALL_VISITORS",
    "trigger_type": "ON_LOAD",
    "frequency": "EVERY_VISIT",
    "announcement_text": "✨ Complimentary Discovery Trio on all orders above ₹2,499 | Free Express Shipping across India",
    "headline": "Unlock 15% OFF Your First Ritual",
    "subheadline": "Experience Korea's pristine botanical actives formulated for luminous glass skin.",
    "coupon_code": "WELCOME15",
    "cta_label": "Explore Collection",
    "cta_url": "/shop",
    "image_url": "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80",
    "show_countdown": False,
    "countdown_end_date": "2026-09-30"
}

def load_marketing_config() -> Dict[str, Any]:
    if not CONFIG_FILE.exists():
        CONFIG_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(DEFAULT_CONFIG, f, indent=2)
        return DEFAULT_CONFIG
    try:
        with open(CONFIG_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            merged = {**DEFAULT_CONFIG, **data}
            return merged
    except Exception:
        return DEFAULT_CONFIG

def save_marketing_config(data: Dict[str, Any]) -> None:
    CONFIG_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

@router.get("/marketing/active", response_model=MarketingCampaignConfig)
def get_active_marketing():
    """Public endpoint for storefront to fetch active marketing pop-up and announcement bar configuration."""
    config = load_marketing_config()
    return config

@router.get("/admin/marketing", response_model=MarketingCampaignConfig)
def get_admin_marketing(current_admin: User = Depends(get_current_admin)):
    """Admin endpoint to fetch complete marketing campaign configuration."""
    return load_marketing_config()

@router.put("/admin/marketing", response_model=MarketingCampaignConfig)
def update_admin_marketing(
    payload: MarketingCampaignConfig,
    current_admin: User = Depends(get_current_admin)
):
    """Admin endpoint to save and publish marketing campaigns in various colors, placement targets, and pop-up styles."""
    save_marketing_config(payload.model_dump())
    return payload
