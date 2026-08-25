import re
from typing import Optional
from fastapi import APIRouter, Depends, Request, Response, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import Product, Category
from app.core.config import settings

router = APIRouter(tags=["SEO & Social Previews"])

# Common crawler/social bot user-agent patterns (WhatsApp, Instagram, Facebook, Twitter, iMessage, etc.)
SOCIAL_BOT_REGEX = re.compile(
    r"(whatsapp|facebookexternalhit|facebot|twitterbot|pinterest|linkedinbot|telegrambot|slackbot|discordbot|applebot|googlebot|bingbot|yandexbot)",
    re.IGNORECASE
)

def is_social_bot(user_agent: str) -> bool:
    if not user_agent:
        return False
    return bool(SOCIAL_BOT_REGEX.search(user_agent))


@router.get("/api/seo/og-card/{product_id_or_slug}", response_class=Response)
def get_product_og_card_image(
    product_id_or_slug: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Dynamically generates a luxury 1200x630 OpenGraph social share card with product imagery,
    price tag, star rating, botanical highlights, and Yurae luxury branding.
    """
    product = None
    if product_id_or_slug.isdigit():
        product = db.query(Product).filter(Product.id == int(product_id_or_slug)).first()
    if not product:
        slug_clean = product_id_or_slug.replace("-", " ")
        product = db.query(Product).filter(
            (Product.name.ilike(f"%{slug_clean}%")) | (Product.sku == product_id_or_slug)
        ).first()

    base_url = str(request.base_url).rstrip("/")
    name = product.name if product else "Yurae Luxury Collection"
    category = (product.category.name if product and product.category else "Luxury Rituals").upper()
    price_val = product.sale_price if product and product.sale_price else (product.price if product else 2400)
    mrp_val = product.price if product and product.sale_price and product.price > product.sale_price else None

    if product and product.images and len(product.images) > 0:
        raw_img = product.images[0].image_url
        if raw_img.startswith("http://") or raw_img.startswith("https://"):
            img_url = raw_img
        elif raw_img.startswith("/"):
            img_url = f"{base_url}{raw_img}"
        else:
            img_url = f"{base_url}/{raw_img}"
    else:
        img_url = f"{base_url}/images/hero-skincare-model.jpg"

    # Escape XML entities for SVG safety
    name_clean = name.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")
    cat_clean = category.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

    name_line1 = name_clean[:32]
    name_line2 = name_clean[32:64] + ("..." if len(name_clean) > 64 else "") if len(name_clean) > 32 else ""

    svg_content = f"""<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="canvasBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFF8FA" />
      <stop offset="50%" stop-color="#FCE7F0" />
      <stop offset="100%" stop-color="#FFF0F5" />
    </linearGradient>
    <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#D84B7E" flood-opacity="0.14" />
    </filter>
    <clipPath id="productImgClip">
      <rect x="680" y="65" width="455" height="500" rx="28" />
    </clipPath>
  </defs>

  <!-- Background Canvas -->
  <rect width="1200" height="630" fill="url(#canvasBg)" />
  <rect x="25" y="25" width="1150" height="580" rx="32" stroke="#F1BCCE" stroke-width="2" fill="none" />

  <!-- Left Content Column -->
  <g transform="translate(80, 80)">
    <!-- Brand Emblem & Category Pill -->
    <rect x="0" y="0" width="280" height="36" rx="18" fill="#FCE7F0" stroke="#F1BCCE" stroke-width="1.5" />
    <text x="140" y="23" fill="#D84B7E" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="800" letter-spacing="2.5" text-anchor="middle">
      ✨ YURAE • {cat_clean}
    </text>

    <!-- Product Title -->
    <text x="0" y="95" fill="#111111" font-family="'Cormorant Garamond', 'Playfair Display', Georgia, serif" font-size="42" font-weight="700" letter-spacing="-0.5">
      {name_line1}
    </text>
    {f'<text x="0" y="145" fill="#111111" font-family="\'Cormorant Garamond\', \'Playfair Display\', Georgia, serif" font-size="36" font-weight="700">{name_line2}</text>' if name_line2 else ''}

    <!-- Price Section Badge -->
    <g transform="translate(0, {190 if name_line2 else 145})">
      <rect x="0" y="0" width="230" height="54" rx="18" fill="#111111" />
      <text x="115" y="35" fill="#FDF4F7" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="800" text-anchor="middle">
        ₹{price_val:,.0f} INR
      </text>
      {f'<text x="250" y="36" fill="#888888" font-family="-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif" font-size="18" text-decoration="line-through">₹{mrp_val:,.0f}</text>' if mrp_val else ''}
    </g>

    <!-- Star Rating & Trust Signals -->
    <g transform="translate(0, {285 if name_line2 else 235})">
      <text x="0" y="0" fill="#EAB308" font-size="20">★★★★★</text>
      <text x="95" y="-2" fill="#4B5563" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700">
        4.9 / 5.0 • Verified Client Reviews
      </text>
    </g>

    <g transform="translate(0, {345 if name_line2 else 295})">
      <text x="0" y="0" fill="#111111" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600">
        🌿 100% Clean Botanical Formulation
      </text>
      <text x="0" y="28" fill="#111111" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600">
        🚚 Complimentary Express Delivery &amp; Luxury Packaging
      </text>
    </g>

    <!-- Bottom Brand Signature -->
    <text x="0" y="{465 if name_line2 else 435}" fill="#D84B7E" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="800" letter-spacing="2">
      YURAE BEAUTY • THE ORIGIN OF SKINCARE
    </text>
  </g>

  <!-- Right Image Column with Drop Shadow Frame -->
  <g filter="url(#cardShadow)">
    <rect x="680" y="65" width="455" height="500" rx="28" fill="#FFFFFF" stroke="#F1BCCE" stroke-width="2" />
    <image x="680" y="65" width="455" height="500" preserveAspectRatio="xMidYMid slice" xlink:href="{img_url}" clip-path="url(#productImgClip)" />
  </g>
</svg>"""
    return Response(content=svg_content, media_type="image/svg+xml")


@router.get("/p/{product_id_or_slug}", response_class=HTMLResponse)
@router.get("/share/product/{product_id_or_slug}", response_class=HTMLResponse)
@router.get("/api/seo/product/{product_id_or_slug}", response_class=HTMLResponse)
def get_product_social_preview(
    product_id_or_slug: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Renders dynamic OpenGraph and Twitter Card social share metadata for WhatsApp, Instagram,
    Facebook, Pinterest, and search engines.
    If a real user visits via browser, seamlessly redirects to the React product details page.
    """
    product = None
    if product_id_or_slug.isdigit():
        product = db.query(Product).filter(Product.id == int(product_id_or_slug)).first()
    if not product:
        slug_clean = product_id_or_slug.replace("-", " ")
        product = db.query(Product).filter(
            (Product.name.ilike(f"%{slug_clean}%")) | (Product.sku == product_id_or_slug)
        ).first()

    base_url = str(request.base_url).rstrip("/")
    brand_name = "YURAE"
    tagline = "Luxury Outfits & Korean-Inspired Botanical Skincare"
    fallback_image = f"{base_url}/images/hero-skincare-model.jpg"
    fallback_url = f"{base_url}/shop"

    if not product:
        title = f"{brand_name} — {tagline}"
        description = "Discover bespoke minimalist fashion, artisanal jewelry, and Korean-inspired botanical skincare rituals."
        image_url = fallback_image
        target_url = fallback_url
        price_str = ""
        category_name = "Luxury Collection"
    else:
        category_name = product.category.name if product.category else "Beauty & Fashion"
        price_val = product.sale_price if product.sale_price else product.price
        price_str = f"₹{price_val:,.0f} INR"
        
        title = f"{product.name} — Luxury {category_name} | {brand_name}"
        short_desc = product.short_description or (product.description[:180] + "..." if product.description else "")
        description = f"{price_str} • {short_desc} • Complimentary Express Shipping & Signature Packaging."
        
        if product.images and len(product.images) > 0:
            raw_img = product.images[0].image_url
            if raw_img.startswith("http://") or raw_img.startswith("https://"):
                image_url = raw_img
            elif raw_img.startswith("/"):
                image_url = f"{base_url}{raw_img}"
            else:
                image_url = f"{base_url}/{raw_img}"
        else:
            image_url = fallback_image

        target_url = f"{base_url}/product/{product.id}"

    html_content = f"""<!DOCTYPE html>
<html lang="en" prefix="og: https://ogp.me/ns# product: https://ogp.me/ns/product#">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <meta name="description" content="{description}">
    <link rel="canonical" href="{target_url}">

    <!-- OpenGraph / Facebook / WhatsApp / Instagram Meta Tags -->
    <meta property="og:site_name" content="{brand_name} | {tagline}">
    <meta property="og:type" content="product">
    <meta property="og:title" content="{title}">
    <meta property="og:description" content="{description}">
    <meta property="og:image" content="{image_url}">
    <meta property="og:image:secure_url" content="{image_url}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="{title}">
    <meta property="og:image:type" content="image/jpeg">
    <meta property="og:url" content="{target_url}">
    <meta property="og:locale" content="en_US">
    
    <!-- Product Specific OpenGraph Tags -->
    <meta property="product:brand" content="{brand_name}">
    <meta property="product:availability" content="in stock">
    <meta property="product:condition" content="new">
    <meta property="product:price:amount" content="{product.sale_price or product.price if product else 0}">
    <meta property="product:price:currency" content="INR">
    <meta property="product:retailer_item_id" content="{product.sku if product else 'YURAE-001'}">

    <!-- Twitter / X Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@YuraeLuxury">
    <meta name="twitter:creator" content="@YuraeLuxury">
    <meta name="twitter:title" content="{title}">
    <meta name="twitter:description" content="{description}">
    <meta name="twitter:image" content="{image_url}">
    <meta name="twitter:image:alt" content="{title}">

    <!-- Pinterest Rich Pin Meta Tags -->
    <meta name="pinterest-rich-pin" content="true">
    <meta property="og:see_also" content="{target_url}">

    <!-- JSON-LD Structured Data Schema -->
    <script type="application/ld+json">
    {{
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": "{product.name if product else brand_name}",
      "image": ["{image_url}"],
      "description": "{description}",
      "sku": "{product.sku if product else 'YURAE'}",
      "brand": {{
        "@type": "Brand",
        "name": "{brand_name}"
      }},
      "offers": {{
        "@type": "Offer",
        "url": "{target_url}",
        "priceCurrency": "INR",
        "price": "{product.sale_price or product.price if product else 0}",
        "itemCondition": "https://schema.org/NewCondition",
        "availability": "https://schema.org/InStock",
        "seller": {{
          "@type": "Organization",
          "name": "{brand_name}"
        }}
      }}
    }}
    </script>

    <!-- Instant Client-Side Redirect for human browsers -->
    <meta http-equiv="refresh" content="0; url={target_url}">
    <script>
      window.location.replace("{target_url}");
    </script>
    <style>
      body {{
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        background-color: #FDF4F7;
        color: #111111;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        margin: 0;
        text-align: center;
        padding: 20px;
      }}
      .card {{
        background: #FFF8FA;
        border: 1px solid #F1BCCE;
        padding: 30px;
        border-radius: 24px;
        max-width: 420px;
        box-shadow: 0 10px 25px rgba(216, 75, 126, 0.08);
      }}
      .card img {{
        width: 100%;
        height: 280px;
        object-fit: cover;
        border-radius: 16px;
        margin-bottom: 20px;
      }}
      h1 {{
        font-size: 20px;
        margin: 0 0 8px;
        color: #111111;
      }}
      p {{
        font-size: 13px;
        color: #666666;
        line-height: 1.5;
      }}
      .btn {{
        display: inline-block;
        margin-top: 15px;
        padding: 12px 28px;
        background: #D84B7E;
        color: #ffffff;
        text-decoration: none;
        border-radius: 50px;
        font-size: 12px;
        font-weight: bold;
        letter-spacing: 1px;
        text-transform: uppercase;
      }}
    </style>
</head>
<body>
    <div class="card">
        <img src="{image_url}" alt="{title}">
        <h1>{product.name if product else brand_name}</h1>
        <p>{description}</p>
        <a href="{target_url}" class="btn">View on Yurae Luxury →</a>
    </div>
</body>
</html>
"""
    return HTMLResponse(content=html_content)
