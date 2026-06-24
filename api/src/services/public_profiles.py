from sqlalchemy.orm import Session
from src.models.profile import Profile


def get_public_profiles(
    db: Session,
    archetype: str | None = None,
    province: str | None = None,
    city: str | None = None,
    limit: int = 50
):
    query = db.query(Profile).filter(
        Profile.is_public == True,
        Profile.is_active == True
    )

    # Archetype filter
    if archetype:
        query = query.filter(Profile.business_category_key == archetype)

    # Location filters (optional, safe fallback)
    if province:
        query = query.filter(Profile.operating_area.ilike(f"%{province}%"))

    if city:
        query = query.filter(Profile.operating_area.ilike(f"%{city}%"))

    return query.limit(limit).all()
