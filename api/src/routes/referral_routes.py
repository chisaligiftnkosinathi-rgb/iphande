from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from src.database import SessionLocal, replay_transaction, get_db
from src.auth.supabase_auth import get_current_user
from src.models.profile import Profile
from src.models.referral import Referral
from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime

router = APIRouter()


class ReferralOut(BaseModel):
    id: str
    referred_profile_id: str
    referral_code: str
    status: str
    reason: Optional[str] = None
    reward_amount: float
    created_at: datetime
    qualified_at: Optional[datetime] = None
    paid_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class ReferralMeResponse(BaseModel):
    referral_code: Optional[str]
    successful_referrals: int
    total_reward: float
    referrals: List[ReferralOut]

@router.get("/referrals/me", response_model=ReferralMeResponse)
def get_my_referrals(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    uid = current_user.get("uid")
    profile = db.query(Profile).filter(Profile.owner_id == uid).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    referrals = db.query(Referral).filter(Referral.referrer_profile_id == profile.id).order_by(Referral.created_at.desc()).all()
    
    successful_count = sum(1 for r in referrals if r.status in ["qualified", "paid"])
    total_reward = sum(r.reward_amount for r in referrals if r.status in ["qualified", "paid"])

    return ReferralMeResponse(
        referral_code=profile.referral_code,
        successful_referrals=successful_count,
        total_reward=total_reward,
        referrals=[ReferralOut.model_validate(r) for r in referrals]
    )

@router.get("/admin/referrals/pending", response_model=List[ReferralOut])
def get_pending_referrals(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    if current_user.get("email") != "glegacey97@gmail.com":
        raise HTTPException(status_code=403, detail="Forbidden")

    referrals = db.query(Referral).filter(Referral.status.in_(["pending", "qualified"])).order_by(Referral.created_at.desc()).all()
    return [ReferralOut.model_validate(r) for r in referrals]

@router.patch("/admin/referrals/{referral_id}/pay", response_model=ReferralOut)
def mark_referral_paid(referral_id: str, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    if current_user.get("email") != "glegacey97@gmail.com":
        raise HTTPException(status_code=403, detail="Forbidden")

    with replay_transaction(db):
        referral = db.query(Referral).filter(Referral.id == referral_id).first()
        if not referral:
            raise HTTPException(status_code=404, detail="Referral not found")
        
        referral.status = "paid"
        referral.paid_at = datetime.utcnow()
        db.flush()
        db.refresh(referral)

    return ReferralOut.model_validate(referral)

@router.patch("/admin/referrals/{referral_id}/reject", response_model=ReferralOut)
def reject_referral(referral_id: str, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    if current_user.get("email") != "glegacey97@gmail.com":
        raise HTTPException(status_code=403, detail="Forbidden")

    with replay_transaction(db):
        referral = db.query(Referral).filter(Referral.id == referral_id).first()
        if not referral:
            raise HTTPException(status_code=404, detail="Referral not found")
        
        referral.status = "rejected"
        referral.reason = "admin_rejected"
        referral.reward_amount = 0.0
        db.flush()
        db.refresh(referral)

    return ReferralOut.model_validate(referral)
