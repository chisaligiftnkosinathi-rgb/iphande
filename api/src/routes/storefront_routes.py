from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from src.database import get_db
from src.models.profile import Profile, BusinessType
from src.models.opportunity import Opportunity, ProductType
from src.models.inventory import InventoryItem

router = APIRouter(prefix="/storefronts", tags=["Storefronts"])


@router.get("/{business_type}")
def get_storefront_catalog(
    business_type: str,
    province: Optional[str] = None,
    city: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """
    Returns an active catalog of products and services for a specific business type:
    - retail: Physical goods & spaza products
    - service: Services, artisan jobs & bookings
    - wholesale: Bulk order items & tiered listings
    - digital: Downloadable assets, courses & digital goods
    """
    valid_types = [t.value for t in BusinessType]
    if business_type not in valid_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid business_type '{business_type}'. Valid types: {valid_types}"
        )

    # Find profiles matching business_type
    profile_query = db.query(Profile).filter(
        Profile.business_type == business_type,
        Profile.is_public == True
    )
    if province:
        profile_query = profile_query.filter(Profile.province == province)
    if city:
        profile_query = profile_query.filter(Profile.city == city)

    profiles = profile_query.all()
    profile_ids = [p.id for p in profiles]

    if not profile_ids:
        return {"items": [], "total": 0, "business_type": business_type}

    # Query active opportunities for these merchants
    items = db.query(Opportunity).filter(
        Opportunity.created_by_profile_id.in_(profile_ids),
        Opportunity.status == "open"
    ).limit(limit).all()

    profile_map = {p.id: p for p in profiles}

    results = []
    for item in items:
        merchant = profile_map.get(item.created_by_profile_id)
        results.append({
            "id": item.id,
            "title": item.title,
            "description": item.description,
            "product_type": getattr(item, "product_type", "service"),
            "price_model": getattr(item, "price_model", "quote_required"),
            "price_amount": float(item.price_amount) if getattr(item, "price_amount", None) else None,
            "delivery_mode": getattr(item, "delivery_mode", "onsite"),
            "sku": getattr(item, "sku", None),
            "stock_quantity": float(item.stock_quantity) if getattr(item, "stock_quantity", None) else None,
            "min_order_quantity": getattr(item, "min_order_quantity", 1),
            "image_url_1": item.image_url_1,
            "image_url_2": item.image_url_2,
            "merchant": {
                "id": merchant.id if merchant else None,
                "name": merchant.name if merchant else None,
                "slug": merchant.slug if merchant else None,
                "currency": getattr(merchant, "currency", "ZAR"),
                "province": merchant.province if merchant else None,
                "city": merchant.city if merchant else None,
                "logo_url": merchant.logo_url if merchant else None,
            }
        })

    return {
        "items": results,
        "total": len(results),
        "business_type": business_type
    }


@router.get("/merchant/{slug}")
def get_merchant_storefront(slug: str, db: Session = Depends(get_db)):
    """
    Returns full public storefront profile and catalog for a merchant by slug.
    """
    profile = db.query(Profile).filter(Profile.slug == slug, Profile.is_public == True).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Merchant not found")

    catalog = db.query(Opportunity).filter(
        Opportunity.created_by_profile_id == profile.id,
        Opportunity.status == "open"
    ).all()

    return {
        "merchant": {
            "id": profile.id,
            "name": profile.name,
            "slug": profile.slug,
            "business_type": getattr(profile, "business_type", "service"),
            "categories": getattr(profile, "categories", []),
            "currency": getattr(profile, "currency", "ZAR"),
            "short_bio": profile.short_bio,
            "cover_photo_url": profile.cover_photo_url,
            "logo_url": profile.logo_url,
            "province": profile.province,
            "city": profile.city,
            "operating_area": profile.operating_area,
            "whatsapp_number": profile.whatsapp_number,
        },
        "catalog": [
            {
                "id": item.id,
                "title": item.title,
                "description": item.description,
                "product_type": getattr(item, "product_type", "service"),
                "price_model": getattr(item, "price_model", "quote_required"),
                "price_amount": float(item.price_amount) if getattr(item, "price_amount", None) else None,
                "delivery_mode": getattr(item, "delivery_mode", "onsite"),
                "sku": getattr(item, "sku", None),
                "stock_quantity": float(item.stock_quantity) if getattr(item, "stock_quantity", None) else None,
                "min_order_quantity": getattr(item, "min_order_quantity", 1),
                "image_url_1": item.image_url_1,
                "image_url_2": item.image_url_2,
            }
            for item in catalog
        ]
    }
