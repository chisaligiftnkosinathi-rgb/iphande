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
    print("Starting Roles data migration...")
    db: Session = SessionLocal()
    try:
        # Add column if it doesn't exist
        try:
            db.execute(text("ALTER TABLE profiles ADD COLUMN role VARCHAR DEFAULT 'steward' NOT NULL;"))
            print("Added role column.")
        except Exception as e:
            print(f"role column might already exist: {e}")
            
        profiles = db.query(Profile).all()
        admin_count = 0
        for profile in profiles:
            if profile.email == "glegacey97@gmail.com":
                profile.role = "system_admin"
                admin_count += 1
            else:
                profile.role = "steward"
            
        db.commit()
        print(f"Migration complete. Elevated {admin_count} users to system_admin.")
    except Exception as e:
        print(f"Migration failed: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    run_migration()
