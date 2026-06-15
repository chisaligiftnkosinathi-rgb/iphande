from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from src.database import get_db
from src.models.profile import Profile
from src.models.continuity_event_model import ContinuityEvent
from src.domain.trust_engine import calculate_trust_profile
from src.auth.supabase_auth import get_current_user

router = APIRouter()

@router.get("/profiles/{profile_id}/trust-profile")
def get_trust_profile(
    profile_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    events = db.query(ContinuityEvent).filter(ContinuityEvent.business_owner_id == profile_id).all()

    return calculate_trust_profile(profile, events)
