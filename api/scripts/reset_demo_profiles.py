import os
import sys
from sqlalchemy.orm import Session
from sqlalchemy import delete

# Add the parent directory to sys.path to allow importing from src
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.database import get_db, SessionLocal
from src.models.profile import Profile
from src.models.opportunity import Opportunity
from src.models.quote import Quote
from src.models.continuity_event_model import ContinuityEvent
from src.models.referral import Referral
from src.models.expense import Expense
from src.models.inventory import InventoryItem
from src.models.invoice import Invoice
from src.models.lead import Lead

DEMO_EMAILS = [
    "sipho.demo@iphande.test",
    "monica.demo@iphande.test",
    "thabo.demo@iphande.test",
    "nomsa.demo@iphande.test"
]

def reset_demo_profiles():
    db: Session = SessionLocal()
    try:
        profiles = db.query(Profile).filter(Profile.email.in_(DEMO_EMAILS)).all()

        if not profiles:
            print("No demo profiles found in the database. They might not be registered yet.")
            return

        for profile in profiles:
            print(f"Resetting data for {profile.email} (Owner ID: {profile.owner_id})...")

            # Clear associated business data
            # Use owner_id if it's available, otherwise use profile.id depending on how relationships are set up.
            owner_id = profile.owner_id
            profile_id = profile.id

            if owner_id:
                db.execute(delete(Opportunity).where(Opportunity.created_by_profile_id == owner_id))
                db.execute(delete(Quote).where(Quote.business_owner_id == owner_id))
                db.execute(delete(Expense).where(Expense.owner_id == owner_id))
                db.execute(delete(InventoryItem).where(InventoryItem.owner_id == owner_id))
                db.execute(delete(Invoice).where(Invoice.business_owner_id == owner_id))
                db.execute(delete(Lead).where(Lead.owner_id == owner_id))
                # Delete referrals where they are the referrer or referee
                db.execute(delete(Referral).where(Referral.referrer_id == profile_id))
                db.execute(delete(Referral).where(Referral.referred_profile_id == profile_id))

            # Delete Continuity Events using direct profile_id
            db.execute(delete(ContinuityEvent).where(ContinuityEvent.profile_id == profile_id))

            # Reset profile state to a "freshly bootstrapped" state, or just delete the profile
            # to let the app recreate it on next login. Deleting is cleaner for a full reset.
            db.delete(profile)

        db.commit()
        print(f"Successfully reset data for {len(profiles)} demo users.")
        print("Note: The Supabase auth users remain active. The next time they log in, they will be prompted to bootstrap their profile again.")

    except Exception as e:
        db.rollback()
        print(f"Error resetting demo profiles: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    reset_demo_profiles()
