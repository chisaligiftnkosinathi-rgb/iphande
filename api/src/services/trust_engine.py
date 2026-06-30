from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from src.models.profile import Profile
from src.models.media import Media
from src.models.opportunity import Opportunity
from src.models.continuity_event_model import ContinuityEvent
from src.models.trust_score import TrustScore
import logging

logger = logging.getLogger(__name__)

def compute_identity_score(db: Session, profile_id: str) -> int:
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        return 0
    
    score = 5  # Profile exists
    if getattr(profile, "is_verified", False):
        score += 5
        
    bio = getattr(profile, "bio", None)
    location = getattr(profile, "town_or_city", None)
    ptype = getattr(profile, "profile_type", None)
    if bio and location and ptype:
        score += 10
        
    return score

def compute_proof_score(db: Session, profile_id: str) -> (int, int):
    # Returns (score, work_proof_count)
    proofs = db.query(Media).filter(
        Media.owner_profile_id == profile_id,
        Media.proof_type == "work",
        Media.linked_entity_id != None
    ).count()
    
    if proofs == 0:
        return (0, 0)
        
    score = 10 + (min(proofs - 1, 6) * 5)
    return (score, proofs)

def compute_economic_score(db: Session, profile_id: str) -> (int, int):
    # Returns (score, completed_opportunities)
    score = 0
    
    created_count = db.query(Opportunity).filter(
        Opportunity.created_by_profile_id == profile_id
    ).count()
    
    if created_count > 0:
        score += 5
        
    closed_events = db.query(ContinuityEvent).filter(
        ContinuityEvent.actor_id == profile_id,
        ContinuityEvent.event_type == "opportunity_closed"
    ).count()
    
    seeker_closed = db.query(Opportunity).filter(
        Opportunity.created_by_profile_id == profile_id,
        Opportunity.status == "closed"
    ).count()
    
    if closed_events > 0:
        score += 10
        
    if seeker_closed > 0:
        score += 5
        
    return (min(score, 25), closed_events)

def compute_activity_score(db: Session, profile_id: str) -> int:
    now = datetime.utcnow()
    last_event = db.query(ContinuityEvent.created_at).filter(
        ContinuityEvent.actor_id == profile_id
    ).order_by(ContinuityEvent.created_at.desc()).first()
    
    if not last_event:
        return 0
        
    days_since = (now - last_event[0]).days
    if days_since <= 7:
        return 15
    elif days_since <= 30:
        return 8
    return 0

def derive_state(score: int, work_proof_count: int, completed_opportunities: int) -> str:
    if score >= 70 and work_proof_count >= 3 and completed_opportunities >= 1:
        return "trusted"
    elif score >= 30:
        return "activated"
    elif score >= 10:
        return "registered"
    else:
        return "anonymous"

def update_trust_score(db: Session, profile_id: str, event_type: str = "sync"):
    identity_score = compute_identity_score(db, profile_id)
    proof_score, work_proof_count = compute_proof_score(db, profile_id)
    economic_score, completed_opportunities = compute_economic_score(db, profile_id)
    activity_score = compute_activity_score(db, profile_id)
    
    total_score = max(0, min(100, identity_score + proof_score + economic_score + activity_score))
    
    new_state = derive_state(total_score, work_proof_count, completed_opportunities)
    
    trust_record = db.query(TrustScore).filter(TrustScore.profile_id == profile_id).first()
    if not trust_record:
        trust_record = TrustScore(
            profile_id=profile_id,
            proof_count=db.query(Media).filter(Media.owner_profile_id == profile_id).count(),
            work_proof_count=work_proof_count,
            opportunity_completion_rate=1.0 if completed_opportunities > 0 else 0.0,
            visibility_score=total_score
        )
        db.add(trust_record)
    else:
        trust_record.proof_count = db.query(Media).filter(Media.owner_profile_id == profile_id).count()
        trust_record.work_proof_count = work_proof_count
        trust_record.opportunity_completion_rate = 1.0 if completed_opportunities > 0 else 0.0
        trust_record.visibility_score = total_score
        
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if profile:
        profile.visibility_state = new_state
        
    logger.info(f"Trust engine synced for {profile_id}. Score: {total_score}, State: {new_state}")
