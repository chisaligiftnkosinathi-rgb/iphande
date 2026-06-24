from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from src.database import get_db
from src.schemas.public_profiles import PublicProfilesResponse, PublicProfileCard
from src.services.public_profiles import get_public_profiles

router = APIRouter()


@router.get("/public/profiles", response_model=PublicProfilesResponse)
def list_public_profiles(
    archetype: str | None = Query(default=None),
    province: str | None = Query(default=None),
    city: str | None = Query(default=None),
    limit: int = 50,
    db: Session = Depends(get_db)
):

    profiles = get_public_profiles(
        db=db,
        archetype=archetype,
        province=province,
        city=city,
        limit=limit
    )

    results = [
        PublicProfileCard(
            id=str(p.id),
            name=p.name,
            slug=p.slug,
            provider_type=p.provider_type,
            business_category_key=p.business_category_key,
            short_bio=p.short_bio,
            location=p.location,
            latitude=p.latitude,
            longitude=p.longitude,
            logo_url=p.logo_url,
            cover_photo_url=p.cover_photo_url,
            services=p.services,
            is_verified=True if getattr(p, "setup_fee_status", None) == "approved" else False
        )
        for p in profiles
    ]

    return {
        "count": len(results),
        "results": results
    }
