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
    if profile.owner_id:
        existing_profile = db.query(Profile).filter(Profile.owner_id == profile.owner_id).first()
        if existing_profile:
            return existing_profile

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
                "profile_name": db_profile.name,
                "profile_slug": db_profile.slug,
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


@router.get("/profiles/by-owner/{owner_id}", response_model=ProfileOut)
def get_profile_by_owner(owner_id: str, db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.owner_id == owner_id).first()
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
