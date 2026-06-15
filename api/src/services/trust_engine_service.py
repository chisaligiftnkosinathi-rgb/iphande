import uuid
from sqlalchemy.orm import Session
from src.models.profile import Profile
from src.models.continuity_event_model import ContinuityEvent, EventCategory

def calculate_trust_score(profile_id: str, db: Session) -> int:
    """
    Evaluates Sustainable Trust based on Truth and Compliance events.
    """
    profile = db.query(Profile).filter(Profile.id == profile_id).first()

    # Trust only fully counts after activation
    if not profile or not profile.is_active:
        return 0

    events = db.query(ContinuityEvent).filter(ContinuityEvent.profile_id == profile_id).all()

    compliance_score = sum(1 for e in events if getattr(e, "category", None) == EventCategory.COMPLIANCE.value)
    truth_score = sum(1 for e in events if getattr(e, "category", None) in [EventCategory.WORK.value, EventCategory.TRUST.value])

    # Sustainable trust requires both truth and compliance
    return truth_score + compliance_score

def evaluate_trust_activation(profile: Profile, db: Session):
    """
    Enforces trust and activation gates.
    """
    if profile.setup_fee_status == "approved" and profile.is_verified and not profile.is_active:
        profile.is_active = True

        if hasattr(profile, "role") and profile.role == "steward":
            profile.role = "verified_steward"

        # Log this state change into the Continuity Engine with explicit UUID
        activation_event = ContinuityEvent(
            id=str(uuid.uuid4()),
            profile_id=profile.id,
            category=EventCategory.COMPLIANCE.value,
            title="Steward Profile Activated",
            description="The profile has been activated following setup fee approval and trust evaluation.",
            evidence_type="system_activation",
            source="trust_engine"
        )
        db.add(activation_event)
