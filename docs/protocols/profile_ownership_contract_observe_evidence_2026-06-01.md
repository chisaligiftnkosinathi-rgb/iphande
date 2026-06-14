# Profile Ownership Contract Observe Evidence (2026-06-01)

Stage: B - Observe
Command:
cd C:\Projects\iphande
Get-Content api\src\models\profile.py
Get-Content api\src\schemas\profile_schema.py
Get-Content api\src\routes\profile_routes.py
Get-Content api\src\services\profile_service.py

## Raw Output
--- FILE: api/src/models/profile.py ---
from sqlalchemy import Column, String, DateTime, Float, Boolean
from sqlalchemy.dialects.sqlite import TEXT
from src.database import Base
import uuid
from datetime import datetime

class Profile(Base):
    __tablename__ = "profiles"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    phone = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    # Location fields
    operating_area = Column(String, nullable=True)
    address_label = Column(String, nullable=True)
    latitude = Column('latitude',  Float, nullable=True)
    longitude = Column('longitude', Float, nullable=True)
    location_is_public = Column('location_is_public',  Boolean, nullable=False, default=False)
    service_radius_km = Column('service_radius_km', Float, nullable=True)
    service_area_notes = Column(String, nullable=True)

    # Business Truthfulness Layer
    business_category_key = Column(String, nullable=True)
    business_line = Column(String, nullable=True)
    services = Column(String, nullable=True)
    contact_method = Column(String, nullable=True)
    offer_types = Column(String, nullable=True)
    pricing_style = Column(String, nullable=True)
    availability = Column(String, nullable=True)
    languages = Column(String, nullable=True)
    trust_posture = Column(String, nullable=True)

    continuity_event_id = Column(String, nullable=True)

--- FILE: api/src/schemas/profile_schema.py ---
from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime


class ProfileCreate(BaseModel):
    name: str
    slug: str
    email: EmailStr
    phone: Optional[str] = None
    operating_area: Optional[str] = None
    address_label: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_is_public: Optional[bool] = False
    service_radius_km: Optional[float] = None
    service_area_notes: Optional[str] = None
    business_category_key: Optional[str] = None
    business_line: Optional[str] = None
    services: Optional[str] = None
    contact_method: Optional[str] = None
    offer_types: Optional[str] = None
    pricing_style: Optional[str] = None
    availability: Optional[str] = None
    languages: Optional[str] = None
    trust_posture: Optional[str] = None


class ProfileOut(BaseModel):
    id: str
    name: str
    slug: str
    email: EmailStr
    phone: Optional[str]
    created_at: datetime
    operating_area: Optional[str] = None
    address_label: Optional[str] = None
    location_is_public: Optional[bool] = False
    service_radius_km: Optional[float] = None
    service_area_notes: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    business_category_key: Optional[str] = None
    business_line: Optional[str] = None
    services: Optional[str] = None
    contact_method: Optional[str] = None
    offer_types: Optional[str] = None
    pricing_style: Optional[str] = None
    availability: Optional[str] = None
    languages: Optional[str] = None
    trust_posture: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_orm_with_privacy(cls, obj):
        # Only expose lat/lon if location_is_public
        base = cls.from_orm(obj)
        if not getattr(obj, "location_is_public", False):
            base.latitude = None
            base.longitude = None
        return base

--- FILE: api/src/routes/profile_routes.py ---
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from src.database import SessionLocal, replay_transaction
from src.models.profile import Profile
from src.schemas.profile_schema import ProfileCreate, ProfileOut
from src.schemas.public_profile_schema import PublicProfileOut
from src.schemas.profile_location_schema import ProfileLocationUpdate
from src.services.continuity_event_service import emit_continuity_event

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/profiles", response_model=ProfileOut)
def create_profile(profile: ProfileCreate, db: Session = Depends(get_db)):
    with replay_transaction(db):
        db_profile = Profile(**profile.dict())
        db.add(db_profile)
        db.flush()

        event = emit_continuity_event(
            db,
            business_owner_id=str(db_profile.id),
            business_category_key=db_profile.business_category_key,
            business_line=db_profile.business_line,
            event_type="profile_created",
            actor_type="business_owner",
            actor_id=str(db_profile.id),
            related_entity_type="profile",
            related_entity_id=str(db_profile.id),
            parent_event_id=None,
            payload={
                "surface": "profile",
                "action": "created",
                "summary_available": True,
            },
            auto_commit=False,
        )
        db_profile.continuity_event_id = str(event.id)
        db.flush()
        db.refresh(db_profile)
    return db_profile


@router.get("/profiles/{profile_id}", response_model=ProfileOut)
def get_profile(profile_id: str, db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return ProfileOut.from_orm_with_privacy(profile)


def get_public_profile(slug: str, db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.slug == slug).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return PublicProfileOut.model_validate(profile)
@router.get("/public/{slug}", response_model=PublicProfileOut)
def get_public_profile(slug: str, db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.slug == slug).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return PublicProfileOut.model_validate(profile)


# PATCH /api/v1/profiles/{profile_id}/location
@router.patch("/profiles/{profile_id}/location", response_model=ProfileOut)
def update_profile_location(profile_id: str, data: ProfileLocationUpdate, db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    update_data = data.dict(exclude_unset=True)
    if not update_data:
        return ProfileOut.from_orm_with_privacy(profile)

    with replay_transaction(db):
        for field, value in update_data.items():
            setattr(profile, field, value)

        event = emit_continuity_event(
            db,
            business_owner_id=str(profile.id),
            business_category_key=profile.business_category_key,
            business_line=profile.business_line,
            event_type="profile_amended",
            actor_type="business_owner",
            actor_id=str(profile.id),
            related_entity_type="profile",
            related_entity_id=str(profile.id),
            parent_event_id=getattr(profile, "continuity_event_id", None),
            payload={
                "surface": "profile",
                "action": "amended",
                "updated_fields": list(update_data.keys()),
                "summary_available": True,
            },
            auto_commit=False,
        )
        profile.continuity_event_id = str(event.id)
        db.flush()
        db.refresh(profile)
    return ProfileOut.from_orm_with_privacy(profile)

--- FILE: api/src/services/profile_service.py ---
# Profile service placeholder for future logic
