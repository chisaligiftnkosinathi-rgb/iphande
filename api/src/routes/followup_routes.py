from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime, date
from src.database import SessionLocal, replay_transaction
from src.models.followup import FollowUp
from src.schemas.followup_schema import FollowUpCreate, FollowUpOut
from src.services.continuity_event_service import emit_continuity_event

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/followups", response_model=FollowUpOut)
def create_followup(followup: FollowUpCreate, db: Session = Depends(get_db)):
    with replay_transaction(db):
        db_followup = FollowUp(**followup.dict())
        db.add(db_followup)
        db.flush()

        owner_id = getattr(db_followup, "profile_id", getattr(db_followup, "owner_profile_id", "system"))

        event = emit_continuity_event(
            db,
            business_owner_id=owner_id,
            business_category_key=None,
            business_line=None,
            event_type="followup_created",
            actor_type="business_owner",
            actor_id=owner_id,
            related_entity_type="followup",
            related_entity_id=str(db_followup.id),
            parent_event_id=getattr(db_followup, "continuity_event_id", None),
            payload={
                "business_owner_id": owner_id,
                "surface": "followup",
                "action": "created",
                "summary_available": True,
            },
            auto_commit=False
        )
        if hasattr(db_followup, "continuity_event_id"):
            db_followup.continuity_event_id = str(event.id)
        db.flush()
        db.refresh(db_followup)
    return db_followup

@router.get("/followups/today", response_model=list[FollowUpOut])
def get_today_followups(db: Session = Depends(get_db)):
    today = date.today()
    return db.query(FollowUp).filter(FollowUp.due_date >= today, FollowUp.due_date < today.replace(day=today.day+1)).all()

@router.patch("/followups/{followup_id}/complete", response_model=FollowUpOut)
def complete_followup(followup_id: str, db: Session = Depends(get_db)):
    followup = db.query(FollowUp).filter(FollowUp.id == followup_id).first()
    if not followup:
        raise HTTPException(status_code=404, detail="FollowUp not found")

    with replay_transaction(db):
        followup.completed = True

        owner_id = getattr(followup, "profile_id", getattr(followup, "owner_profile_id", "system"))

        event = emit_continuity_event(
            db,
            business_owner_id=owner_id,
            business_category_key=None,
            business_line=None,
            event_type="followup_amended",
            actor_type="business_owner",
            actor_id=owner_id,
            related_entity_type="followup",
            related_entity_id=str(followup.id),
            parent_event_id=getattr(followup, "continuity_event_id", None),
            payload={
                "updated_fields": ["completed"],
                "summary_available": True,
            },
            auto_commit=False
        )
        if hasattr(followup, "continuity_event_id"):
            followup.continuity_event_id = str(event.id)
        db.flush()
        db.refresh(followup)
    return followup
