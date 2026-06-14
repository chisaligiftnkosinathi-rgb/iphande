import os
import sys

# Ensure api directory is in sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from sqlalchemy.orm import Session
from sqlalchemy import text
from src.database import SessionLocal, engine
from src.models.profile import Profile

def run_migration():
    print("Starting Freemium data migration...")
    db: Session = SessionLocal()
    try:
        # Add columns if they don't exist
        try:
            db.execute(text("ALTER TABLE profiles ADD COLUMN plan_code VARCHAR DEFAULT 'free' NOT NULL;"))
            print("Added plan_code column.")
        except Exception as e:
            print(f"plan_code column might already exist: {e}")
            
        try:
            db.execute(text("ALTER TABLE profiles ADD COLUMN subscription_active BOOLEAN DEFAULT TRUE NOT NULL;"))
            print("Added subscription_active column.")
        except Exception as e:
            print(f"subscription_active column might already exist: {e}")

        profiles = db.query(Profile).all()
        migrated_count = 0
        free_count = 0
        for profile in profiles:
            if getattr(profile, "setup_fee_status", None) == "approved":
                profile.plan_code = "business"
                migrated_count += 1
            else:
                profile.plan_code = "free"
                free_count += 1
            
            profile.subscription_active = True
            
        db.commit()
        print(f"Migration complete. Found {migrated_count} approved profiles (now Business) and {free_count} pending/new profiles (now Free).")
    except Exception as e:
        print(f"Migration failed: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    run_migration()
