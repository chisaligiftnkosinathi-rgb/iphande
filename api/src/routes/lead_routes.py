from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List

from src.database import SessionLocal, replay_transaction
from src.models.lead import Lead
from src.models.profile import Profile
from src.schemas.lead_schema import LeadCreate, LeadUpdate, LeadOut
from src.auth.supabase_auth import get_current_firebase_user

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/leads", response_model=LeadOut)
def create_lead(lead_in: LeadCreate, db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.slug == lead_in.profile_slug).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    with replay_transaction(db):
        db_lead = Lead(
            owner_id=profile.owner_id,
            profile_slug=lead_in.profile_slug,
            name=lead_in.name,
            phone=lead_in.phone,
            service_needed=lead_in.service_needed,
            message=lead_in.message,
            status="new",
            source=lead_in.source or "public_profile"
        )
        db.add(db_lead)
        db.flush()
        db.refresh(db_lead)
    return db_lead

@router.get("/leads/me", response_model=List[LeadOut])
def get_my_leads(db: Session = Depends(get_db), current_user: dict = Depends(get_current_firebase_user)):
    uid = current_user.get("uid")
    leads = db.query(Lead).filter(Lead.owner_id == uid).order_by(Lead.created_at.desc()).all()
    return leads

@router.patch("/leads/{lead_id}", response_model=LeadOut)
def update_lead_status(lead_id: str, lead_update: LeadUpdate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_firebase_user)):
    uid = current_user.get("uid")
    lead = db.query(Lead).filter(Lead.id == lead_id, Lead.owner_id == uid).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    with replay_transaction(db):
        lead.status = lead_update.status
        db.flush()
        db.refresh(lead)
    return lead
