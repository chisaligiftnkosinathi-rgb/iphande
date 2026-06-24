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
    archetype: Optional[str] = None,
    province: Optional[str] = None,
    city: Optional[str] = None,
    suburb: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Profile).filter(
        Profile.is_public == True,
        Profile.is_verified == True
    )

    if archetype:
        query = query.filter(Profile.business_category_key == archetype)
    if province:
        query = query.filter(Profile.province == province)
    if city:
        query = query.filter(Profile.city == city)
    if suburb:
        query = query.filter(Profile.suburb == suburb)

    results = query.all()

    grouped = {}
    for profile in results:
        arch = profile.business_category_key or "unclassified"
        if arch not in grouped:
            grouped[arch] = []

        # Count proof of work items
        proof_count = 0
        try:
            import json
            if profile.supporting_image_urls:
                if isinstance(profile.supporting_image_urls, list):
                    proof_count += len([u for u in profile.supporting_image_urls if u])
                elif isinstance(profile.supporting_image_urls, str):
                    proof_count += len([u for u in json.loads(profile.supporting_image_urls) if u])
            if profile.proof_of_work_items:
                parsed_pow = json.loads(profile.proof_of_work_items)
                if isinstance(parsed_pow, list):
                    proof_count += len([item for item in parsed_pow if item.get('url')])
        except Exception:
            pass

        grouped[arch].append({
            "id": str(profile.id),
            "slug": profile.slug,
            "name": profile.name,
            "business_line": profile.business_line,
            "city": profile.city,
            "province": profile.province,
            "is_verified": profile.is_verified,
            "proof_count": proof_count
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
        Opportunity.created_by_profile_id == str(profile.id)
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
            "archetype": opp.category_key or "opportunity"
        }
        for opp in opportunities
    ]

    return {
        "profile": profile,
        "opportunities": opp_summaries,
        "services": services_list,
        "supporting_images": supporting_images_list,
        "location_string": location_string
    }
