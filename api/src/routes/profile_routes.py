from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from src.database import SessionLocal, replay_transaction
import uuid
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from src.models.profile import Profile
from src.schemas.profile_schema import ProfileCreate, ProfileOut, ProfileUpdate
from src.schemas.public_profile_schema import PublicProfileOut
from src.schemas.profile_location_schema import ProfileLocationUpdate
from src.services.continuity_event_service import emit_continuity_event
from src.auth.supabase_auth import get_current_firebase_user

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/profiles", response_model=ProfileOut)
def create_profile(profile: ProfileCreate, db: Session = Depends(get_db)):
    existing_profile = None
    if profile.owner_id:
        existing_profile = db.query(Profile).filter(Profile.owner_id == profile.owner_id).first()

    with replay_transaction(db):
        if existing_profile:
            update_data = profile.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(existing_profile, field, value)

            raw_parent_id = getattr(existing_profile, "continuity_event_id", None)
            parent_uuid = uuid.UUID(raw_parent_id) if isinstance(raw_parent_id, str) else raw_parent_id

            event = emit_continuity_event(
                db,
                business_owner_id=str(existing_profile.id),
                business_category_key=existing_profile.business_category_key,
                business_line=existing_profile.business_line,
                event_type="profile_amended",
                actor_type="business_owner",
                actor_id=str(existing_profile.id),
                related_entity_type="profile",
                related_entity_id=str(existing_profile.id),
                parent_event_id=parent_uuid,
                payload={
                    "surface": "profile",
                    "action": "amended",
                    "profile_name": existing_profile.name,
                    "profile_slug": existing_profile.slug,
                    "summary_available": True,
                },
                auto_commit=False,
            )
            existing_profile.continuity_event_id = str(event.id)
            db.flush()
            db.refresh(existing_profile)
            return existing_profile

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


@router.post("/profiles/bootstrap", response_model=ProfileOut)
def bootstrap_profile(db: Session = Depends(get_db), current_user: dict = Depends(get_current_firebase_user)):
    uid = current_user.get("uid")
    email = current_user.get("email")

    existing_profile = db.query(Profile).filter(Profile.owner_id == uid).first()
    if existing_profile:
        return ProfileOut.from_orm_with_privacy(existing_profile)

    with replay_transaction(db):
        db_profile = Profile(
            owner_id=uid,
            email=email,
            name=email.split("@")[0] if email else "Steward",
            slug=uid,  # Use UID as a safe, temporary unique slug
            setup_fee_status="pending",
            is_public=False
        )
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
                "surface": "profile_bootstrap",
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

    return ProfileOut.from_orm_with_privacy(db_profile)


@router.get("/profiles/me", response_model=ProfileOut)
def get_my_profile(db: Session = Depends(get_db), current_user: dict = Depends(get_current_firebase_user)):
    uid = current_user.get("uid")
    profile = db.query(Profile).filter(Profile.owner_id == uid).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return ProfileOut.from_orm_with_privacy(profile)


@router.patch("/profiles/me", response_model=ProfileOut)
def update_my_profile(data: ProfileUpdate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_firebase_user)):
    uid = current_user.get("uid")
    profile = db.query(Profile).filter(Profile.owner_id == uid).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    update_data = data.model_dump(exclude_unset=True) if hasattr(data, 'model_dump') else data.dict(exclude_unset=True)
    if not update_data:
        return ProfileOut.from_orm_with_privacy(profile)

    with replay_transaction(db):
        for field, value in update_data.items():
            setattr(profile, field, value)

        raw_parent_id = getattr(profile, "continuity_event_id", None)
        parent_uuid = uuid.UUID(raw_parent_id) if isinstance(raw_parent_id, str) else raw_parent_id

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
            parent_event_id=parent_uuid,
            payload={
                "surface": "profile_me",
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


@router.get("/profiles", response_model=List[ProfileOut])
def list_profiles(setup_fee_status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Profile)
    if setup_fee_status:
        query = query.filter(Profile.setup_fee_status == setup_fee_status)
    profiles = query.all()
    return [ProfileOut.from_orm_with_privacy(p) for p in profiles]

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

        raw_parent_id = getattr(profile, "continuity_event_id", None)
        parent_uuid = uuid.UUID(raw_parent_id) if isinstance(raw_parent_id, str) else raw_parent_id

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
            parent_event_id=parent_uuid,
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

@router.patch("/profiles/{profile_id}/visibility")
def update_profile_visibility(profile_id: str, payload: ProfileVisibilityUpdate, db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    update_data = payload.model_dump(exclude_unset=True) if hasattr(payload, 'model_dump') else payload.dict(exclude_unset=True)

    for key, value in update_data.items():
        setattr(profile, key, value)

    db.commit()
    db.refresh(profile)

    return {"status": "success", "profile_id": profile.id, "slug": profile.slug}

class SetupFeeReview(BaseModel):
    setup_fee_status: str
    setup_fee_review_note: Optional[str] = None

@router.patch("/profiles/{profile_id}/setup-fee", response_model=ProfileOut)
def review_setup_fee(profile_id: str, payload: SetupFeeReview, db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    profile.setup_fee_status = payload.setup_fee_status
    profile.setup_fee_review_note = payload.setup_fee_review_note

    if payload.setup_fee_status in ["paid", "waived"]:
        profile.setup_fee_paid_at = datetime.utcnow()

    db.commit()
    db.refresh(profile)

    return ProfileOut.from_orm_with_privacy(profile)
