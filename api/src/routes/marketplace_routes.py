from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from src.database import get_db
from src.models.opportunity import Opportunity, ProductType
from src.models.profile import Profile
from sqlalchemy import or_

router = APIRouter(prefix="/marketplace", tags=["Marketplace"])


@router.get("/")
def list_marketplace_feed(
    product_type: Optional[str] = Query(None, description="physical, service, digital"),
    category: Optional[str] = Query(None, description="category key"),
    province: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    q: Optional[str] = Query(None, description="Keyword search"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    Public marketplace feed returning verified products and services across all active merchants.
    """
    query = db.query(Opportunity).filter(
        Opportunity.is_public == True,
        Opportunity.status == "open"
    )

    if product_type:
        query = query.filter(Opportunity.product_type == product_type)
    if category:
        query = query.filter(Opportunity.category_key == category)
    if province:
        query = query.filter(Opportunity.province.ilike(f"%{province}%"))
    if city:
        query = query.filter(Opportunity.town_or_city.ilike(f"%{city}%"))
    if q:
        search_pattern = f"%{q}%"
        query = query.filter(
            or_(
                Opportunity.title.ilike(search_pattern),
                Opportunity.description.ilike(search_pattern),
                Opportunity.service_needed.ilike(search_pattern)
            )
        )

    total = query.count()
    items = query.order_by(Opportunity.created_at.desc()).offset(offset).limit(limit).all()

    # Pre-fetch merchants in one round-trip
    merchant_ids = list(set([item.created_by_profile_id for item in items if item.created_by_profile_id]))
    merchants = db.query(Profile).filter(Profile.id.in_(merchant_ids)).all() if merchant_ids else []
    merchant_map = {m.id: m for m in merchants}

    results = []
    for item in items:
        merchant = merchant_map.get(item.created_by_profile_id)
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
            "category_key": item.category_key,
            "location": {
                "province": item.province,
                "city": item.town_or_city,
                "suburb": item.suburb_or_area,
            },
            "merchant": {
                "id": merchant.id if merchant else None,
                "name": merchant.name if merchant else "Verified Merchant",
                "slug": merchant.slug if merchant else None,
                "currency": getattr(merchant, "currency", "ZAR"),
                "logo_url": merchant.logo_url if merchant else None,
                "business_type": getattr(merchant, "business_type", "service"),
            }
        })

    return {
        "items": results,
        "total": total,
        "offset": offset,
        "limit": limit
    }
