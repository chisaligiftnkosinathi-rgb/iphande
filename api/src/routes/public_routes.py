from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from src.database import get_db
from src.models.opportunity import Opportunity
from src.models.profile import Profile
from src.models.enums import OpportunityArchetype

router = APIRouter(prefix="/public", tags=["Public Visibility"])

@router.get("/opportunities")
def get_public_opportunities(
    archetype: Optional[OpportunityArchetype] = None,
    province: Optional[str] = None,
    city: Optional[str] = None,
    suburb: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Opportunity).filter(Opportunity.is_public == True)

    if archetype:
        query = query.filter(Opportunity.archetype == archetype)
    if province:
        query = query.filter(Opportunity.province == province)
    if city:
        query = query.filter(Opportunity.city == city)
    if suburb:
        query = query.filter(Opportunity.suburb == suburb)

    results = query.all()

    # Group the opportunities by archetype
    grouped = {}
    for opp in results:
        arch = opp.archetype.value if hasattr(opp.archetype, 'value') else opp.archetype
        if arch not in grouped:
            grouped[arch] = []

        grouped[arch].append({
            "id": str(opp.id),
            "title": opp.title,
            "location_name": opp.location_name,
            "city": opp.city,
            "province": opp.province,
            "suburb": opp.suburb,
            "public_contact_whatsapp": getattr(opp, "public_contact_whatsapp", None)
        })

    formatted_groups = [{"archetype": arch, "items": items} for arch, items in grouped.items()]

    return {
        "province": province,
        "city": city,
        "suburb": suburb,
        "groups": formatted_groups
    }

@router.get("/business/{slug}")
def get_public_business_profile(slug: str, db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.slug == slug, Profile.is_public == True).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Business not found")

    opportunities = db.query(Opportunity).filter(
        Opportunity.profile_id == profile.id,
        Opportunity.is_public == True
    ).all()

    location_parts = [part for part in [profile.suburb, profile.city, profile.province] if part]
    location_string = ", ".join(location_parts) if location_parts else "Location not specified"

    services_list = []
    if profile.services:
        services_list = [s.strip() for s in str(profile.services).split(",") if s.strip()]

    supporting_images_list = []
    if profile.supporting_image_urls:
        supporting_images_list = [url.strip() for url in str(profile.supporting_image_urls).split(",") if url.strip()]

    opp_summaries = [
        {
            "id": str(opp.id),
            "title": opp.title,
            "archetype": opp.archetype or "opportunity"
        }
        for opp in opportunities
    ]

    return {
        "slug": profile.slug,
        "name": profile.name,
        "steward_story": profile.short_bio or "No story provided yet.",
        "location_string": location_string,
        "whatsapp_number": profile.whatsapp_number,
        "cover_photo_url": profile.cover_photo_url,
        "logo_url": profile.logo_url,
        "supporting_images": supporting_images_list,
        "services": services_list,
        "opportunities": opp_summaries
    }
