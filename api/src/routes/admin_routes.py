from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from datetime import datetime

from src.database import get_db, replay_transaction
from src.models.profile import Profile
from src.models.opportunity import Opportunity
from src.core.security import get_current_user
from src.services.continuity_event_service import emit_continuity_event
from src.config import BOOTSTRAP_ADMIN_EMAILS
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])
# Compatibility for main.py which included admin_router separately
admin_router = APIRouter()

def get_admin_user(user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.user_id == user["uid"]).first()
    if not profile:
        raise HTTPException(status_code=401, detail="Authentication required")
        
    user_email = user.get("email", "").lower()
    if user_email in BOOTSTRAP_ADMIN_EMAILS and getattr(profile, "role", "steward") != "admin":
        with replay_transaction(db):
            profile.role = "admin"
            emit_continuity_event(
                db=db,
                profile_id=profile.id,
                event_type="AdminAutoPromotion",
                description="Auto-promoted bootstrap admin on login.",
                category="system"
            )
            db.flush()
            db.refresh(profile)
            
    if getattr(profile, "role", "steward") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return profile

def get_bootstrap_admin(user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = get_admin_user(user, db)
    user_email = user.get("email", "").lower()
    if user_email not in BOOTSTRAP_ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail="Bootstrap admin access required")
    return profile

class DashboardStatsOut(BaseModel):
    total_profiles: int
    pending_reviews: int
    approved_profiles: int
    total_opportunities: int

@router.get("/dashboard", response_model=DashboardStatsOut)
def get_admin_dashboard(admin_user: Profile = Depends(get_admin_user), db: Session = Depends(get_db)):
    total_profiles = db.query(func.count(Profile.id)).scalar() or 0
    pending_reviews = db.query(func.count(Profile.id)).filter(Profile.setup_fee_status == "pending_review").scalar() or 0
    approved_profiles = db.query(func.count(Profile.id)).filter(Profile.setup_fee_status == "approved").scalar() or 0
    total_opportunities = db.query(func.count(Opportunity.id)).scalar() or 0

    return DashboardStatsOut(
        total_profiles=total_profiles,
        pending_reviews=pending_reviews,
        approved_profiles=approved_profiles,
        total_opportunities=total_opportunities
    )

class PaymentReviewOut(BaseModel):
    profile_id: str
    name: str
    email: str
    business_name: Optional[str]
    setup_fee_status: str
    setup_fee_proof_url: Optional[str]
    setup_fee_review_note: Optional[str]

    class Config:
        from_attributes = True

@router.get("/profiles/payment-proofs", response_model=List[PaymentReviewOut])
def list_payment_proofs(
    status: Optional[str] = Query(None, description="Filter by status, e.g. pending_review"),
    admin_user: Profile = Depends(get_admin_user), 
    db: Session = Depends(get_db)
):
    query = db.query(Profile)
    if status:
        query = query.filter(Profile.setup_fee_status == status)
    
    profiles = query.all()
    
    return [
        PaymentReviewOut(
            profile_id=str(p.id),
            name=p.name,
            email=p.email,
            business_name=p.business_line,
            setup_fee_status=p.setup_fee_status or "not_submitted",
            setup_fee_proof_url=p.setup_fee_proof_url,
            setup_fee_review_note=p.setup_fee_review_note
        )
        for p in profiles
    ]

@router.post("/profiles/{profile_id}/approve-payment")
def approve_payment(profile_id: str, admin_user: Profile = Depends(get_admin_user), db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    with replay_transaction(db):
        profile.setup_fee_status = "approved"
        profile.is_verified = True
        profile.is_active = True
        
        if not profile.setup_fee_paid_at:
            profile.setup_fee_paid_at = datetime.utcnow()
            
        if not profile.activated_at:
            profile.activated_at = datetime.utcnow()
            
        emit_continuity_event(
            db=db,
            profile_id=profile.id,
            event_type="AdminApproval",
            description="Admin approved profile setup fee and activated profile.",
            category="financial"
        )
        
        db.flush()
        db.refresh(profile)

    return {"status": "success", "message": "Profile approved and fully unlocked"}

class RejectPayload(BaseModel):
    review_note: str

@router.post("/profiles/{profile_id}/reject-payment")
def reject_payment(profile_id: str, payload: RejectPayload, admin_user: Profile = Depends(get_admin_user), db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    with replay_transaction(db):
        profile.setup_fee_status = "rejected"
        profile.setup_fee_review_note = payload.review_note
        # Keep false
        profile.is_verified = False
        profile.is_active = False
        
        emit_continuity_event(
            db=db,
            profile_id=profile.id,
            event_type="AdminRejection",
            description=f"Admin rejected setup fee: {payload.review_note}",
            category="financial"
        )
        
        db.flush()
        db.refresh(profile)

    return {"status": "success", "message": "Profile rejected with reason"}

class PlanUpdatePayload(BaseModel):
    plan_code: str

@router.patch("/profiles/{profile_id}/plan")
def update_profile_plan(profile_id: str, payload: PlanUpdatePayload, admin_user: Profile = Depends(get_admin_user), db: Session = Depends(get_db)):
    from src.models.constants import PLAN_FEATURES
    
    if payload.plan_code not in PLAN_FEATURES:
        raise HTTPException(status_code=400, detail="Invalid plan code")
        
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
        
    with replay_transaction(db):
        profile.plan_code = payload.plan_code
        if payload.plan_code != "free":
            profile.is_verified = True
        db.flush()
        db.refresh(profile)
        
    return {"status": "success", "plan_code": profile.plan_code}

class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: str

@router.get("/users", response_model=List[UserOut])
def list_users(admin_user: Profile = Depends(get_admin_user), db: Session = Depends(get_db)):
    profiles = db.query(Profile).all()
    return [
        UserOut(
            id=str(p.id),
            name=p.name or "Unnamed",
            email=p.email or "",
            role=p.role or "steward"
        )
        for p in profiles
    ]

@router.post("/users/{profile_id}/promote-admin")
def promote_admin(profile_id: str, admin_user: Profile = Depends(get_bootstrap_admin), db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
        
    if getattr(profile, "role", "steward") == "admin":
        return {"status": "success", "message": "Already an admin"}

    with replay_transaction(db):
        profile.role = "admin"
        emit_continuity_event(
            db=db,
            profile_id=profile.id,
            event_type="AdminPromotion",
            description=f"Promoted to admin by bootstrap admin {admin_user.email}",
            category="system"
        )
        db.flush()
        db.refresh(profile)

    return {"status": "success", "message": "User promoted to admin"}

@router.post("/users/{profile_id}/demote-admin")
def demote_admin(profile_id: str, admin_user: Profile = Depends(get_bootstrap_admin), db: Session = Depends(get_db)):
    if str(admin_user.id) == profile_id:
        raise HTTPException(status_code=400, detail="Cannot demote yourself")

    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    if getattr(profile, "role", "steward") != "admin":
        return {"status": "success", "message": "User is not an admin"}

    with replay_transaction(db):
        profile.role = "steward"
        emit_continuity_event(
            db=db,
            profile_id=profile.id,
            event_type="AdminDemotion",
            description=f"Demoted from admin by bootstrap admin {admin_user.email}",
            category="system"
        )
        db.flush()
        db.refresh(profile)

    return {"status": "success", "message": "User demoted from admin"}

