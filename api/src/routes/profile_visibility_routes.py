from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from src.database import get_db
from src.models.profile import Profile

router = APIRouter(prefix="/api/v1/profiles", tags=["Profile Visibility"])

class ProfileVisibilityUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    short_bio: Optional[str] = None
    whatsapp_number: Optional[str] = None
    facebook_page_url: Optional[str] = None
    province: Optional[str] = None
    city: Optional[str] = None
    suburb: Optional[str] = None
    services: Optional[str] = None
    cover_photo_url: Optional[str] = None
    logo_url: Optional[str] = None
    supporting_image_urls: Optional[str] = None
    is_public: Optional[bool] = None

@router.patch("/{profile_id}/visibility")
def update_profile_visibility(profile_id: str, payload: ProfileVisibilityUpdate, db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    # In V1, we trust the profile_id provided to the endpoint (add auth dependency here later)
    update_data = payload.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(profile, key, value)

    db.commit()
    db.refresh(profile)

    return {"status": "success", "profile_id": profile.id, "slug": profile.slug}
