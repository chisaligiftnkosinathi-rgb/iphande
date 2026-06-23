from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID
from datetime import datetime, timezone

from src.database import get_db, replay_transaction
from src.models.opportunity import Opportunity
from src.models.profile import Profile
from src.models.enums import OpportunityArchetype
from src.models.archetype_constants import ARCHETYPES
from src.services.verification_service import require_verified_steward_or_platform_admin
from src.models.quote import Quote, QuoteStatus
from src.services.document_engine import generate_quote_pdf
from src.services.continuity_event_service import emit_continuity_event
from src.schemas.quote_to_cash_schema import QuoteOut

router = APIRouter(prefix="/public", tags=["Public Visibility"])

@router.get("/archetypes")
def list_archetypes():
    return list(ARCHETYPES.values())

@router.get("/archetypes/{archetype_key}")
def get_archetype(archetype_key: str):
    if archetype_key not in ARCHETYPES:
        raise HTTPException(status_code=404, detail="Archetype not found")
    return ARCHETYPES[archetype_key]

@router.get("/archetypes/{archetype_key}/templates")
def get_archetype_templates(archetype_key: str):
    if archetype_key not in ARCHETYPES:
        raise HTTPException(status_code=404, detail="Archetype not found")
    arch = ARCHETYPES[archetype_key]
    return {
        "service_templates": arch["service_templates"],
        "document_templates": arch["document_templates"]
    }

@router.get("/opportunities")
def get_public_opportunities(
    archetype: Optional[OpportunityArchetype] = None,
    province: Optional[str] = None,
    city: Optional[str] = None,
    suburb: Optional[str] = None,
    place_code: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Opportunity).filter(Opportunity.is_public == True)

    if archetype:
        query = query.filter(Opportunity.archetype == archetype)
    if province:
        query = query.filter(Opportunity.province == province)
    if city:
        query = query.filter(Opportunity.town_or_city == city)
    if suburb:
        query = query.filter(Opportunity.suburb_or_area == suburb)
    if place_code:
        query = query.filter(Opportunity.place_code == place_code)

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
            "location_name": getattr(opp, "location_name", None),
            "city": opp.town_or_city,
            "province": opp.province,
            "suburb": opp.suburb_or_area,
            "latitude": opp.latitude,
            "longitude": opp.longitude,
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
    # Diagnostic: Query by slug first to see if it exists at all
    profile = db.query(Profile).filter(Profile.slug == slug).first()
    if not profile:
        raise HTTPException(status_code=404, detail=f"Profile with slug '{slug}' not found in database.")

    # Now, check if it's public. If not, raise a specific error.
    if not profile.is_public:
        raise HTTPException(
            status_code=403, detail=f"Profile '{slug}' found, but it is not public. The 'is_public' flag is False."
        )

    # Check verification status
    require_verified_steward_or_platform_admin(profile)

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

    retu
