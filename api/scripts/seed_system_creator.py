import os
import sys
from sqlalchemy.orm import Session
from datetime import datetime
import uuid

# Add the api directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.database import SessionLocal, replay_transaction
from src.models.profile import Profile
from src.services.continuity_event_service import emit_continuity_event

def seed_system_creator():
    db: Session = SessionLocal()
    
    email = "glegacey97@gmail.com"  # Using the known system creator email from _apply_system_creator_override
    slug = "iphande_origin"
    
    try:
        profile = db.query(Profile).filter(Profile.email == email).first()
        
        if not profile:
            # If the profile doesn't exist yet, create it.
            print(f"Creating new System Creator profile for {email}...")
            profile = Profile(
                owner_id="system_creator_override_id",
                email=email,
                name="Gift Nkosinathi Chisali",
                slug=slug,
            )
            db.add(profile)
            db.flush()
        
        with replay_transaction(db):
            profile.name = "Gift Nkosinathi Chisali"
            profile.role = "system_creator"
            profile.trust_posture = "foundational_steward"
            profile.business_line = "iphande_origin"
            profile.is_verified = True
            profile.is_active = True
            profile.setup_fee_status = "approved"
            profile.plan_code = "business"
            profile.subscription_active = True
            
            if not profile.activated_at:
                profile.activated_at = datetime.utcnow()
            if not profile.setup_fee_paid_at:
                profile.setup_fee_paid_at = datetime.utcnow()
            
            # Create first canonical ContinuityEvent
            event = emit_continuity_event(
                db=db,
                business_owner_id=str(profile.id),
                business_category_key=profile.business_category_key,
                business_line=profile.business_line,
                event_type="system_foundation",
                actor_type="system",
                actor_id=str(profile.id),
                related_entity_type="profile",
                related_entity_id=str(profile.id),
                parent_event_id=None,
                evidence_type="canonical_doctrine",
                title="The Steward's Compass Canonized",
                description="Canon Document 001 was created to define the vision, doctrine, and life principles behind iPhande.",
                source="docs/canonical/THE_STEWARDS_COMPASS.md",
                payload={},
                auto_commit=False,
            )
            
            profile.continuity_event_id = str(event.id)
            
            db.flush()
            db.refresh(profile)
            
            print(f"Successfully seeded system creator: {profile.name} (Role: {profile.role}, Trust: {profile.trust_posture})")
            print(f"Emitted continuity event: {event.title}")
            
    except Exception as e:
        print(f"Error seeding system creator: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_system_creator()
