from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from src.database import get_db, replay_transaction
from src.models.profile import Profile
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

admin_router = APIRouter(prefix="/api/v1/admin", tags=["admin"])
router = APIRouter(prefix="/api/v1/admin/payment-reviews", tags=["admin"])

# Note: In a real production system, you'd add an admin auth dependency here.
# For V1 demo/simulation purposes, we are exposing this without strict auth.

class PaymentReviewOut(BaseModel):
    profile_id: str
    name: str
    email: str
    business_name: Optional[str]
    setup_fee_status: str
    setup_fee_proof_url: Optional[str]
    setup_fee_review_note: Optional[str]

    class Config:
        orm_mode = True

@router.get("", response_model=List[PaymentReviewOut])
def list_pending_reviews(db: Session = Depends(get_db)):
    profiles = db.query(Profile).filter(Profile.setup_fee_status == "pending_review").all()
    return [
        PaymentReviewOut(
            profile_id=p.id,
            name=p.name,
            email=p.email,
            business_name=p.business_line,
            setup_fee_status=p.setup_fee_status,
            setup_fee_proof_url=p.setup_fee_proof_url,
            setup_fee_review_note=p.setup_fee_review_note
        )
        for p in profiles
    ]

@router.post("/{profile_id}/approve")
def approve_payment(profile_id: str, db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    with replay_transaction(db):
        profile.setup_fee_status = "approved"
        profile.is_verified = True
        profile.activated_at = datetime.utcnow()
        db.flush()
        db.refresh(profile)

    return {"status": "success", "message": "Profile approved and fully unlocked"}

class RejectPayload(BaseModel):
    review_note: str

@router.post("/{profile_id}/reject")
def reject_payment(profile_id: str, payload: RejectPayload, db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    with replay_transaction(db):
        profile.setup_fee_status = "rejected"
        profile.setup_fee_review_note = payload.review_note
        db.flush()
        db.refresh(profile)

    return {"status": "success", "message": "Profile rejected with reason"}

class PlanUpdatePayload(BaseModel):
    plan_code: str

@admin_router.patch("/profiles/{profile_id}/plan")
def update_profile_plan(profile_id: str, payload: PlanUpdatePayload, db: Session = Depends(get_db)):
    from src.models.constants import PLAN_FEATURES
    
    if payload.plan_code not in PLAN_FEATURES:
        raise HTTPException(status_code=400, detail="Invalid plan code")
        
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
        
    with replay_transaction(db):
        profile.plan_code = payload.plan_code
        if payload.plan_code != "free":
            profile.is_verified = True # V1 simplification: paying implies verification
        db.flush()
        db.refresh(profile)
        
    return {"status": "success", "plan_code": profile.plan_code}
