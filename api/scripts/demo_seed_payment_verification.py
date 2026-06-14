from sqlalchemy.orm import Session
from src.database import SessionLocal
from src.models.profile import Profile
from datetime import datetime
import uuid

def seed_demo_users():
    db: Session = SessionLocal()

    targets = {
        "sipho-m-plumbing": {
            "name": "Sipho's Plumbing",
            "email": "sipho@example.com",
            "status": "approved", "is_verified": True
        },
        "monica-t-salon": {
            "name": "Monica's Hair Salon",
            "email": "monica@example.com",
            "status": "approved", "is_verified": True
        },
        "thabo-n-transport": {
            "name": "Thabo Transport",
            "email": "thabo@example.com",
            "status": "pending_review", "is_verified": False, "proof_url": "https://drive.google.com/proof1"
        },
        "nomsa-k-cleaning": {
            "name": "Nomsa Cleaning",
            "email": "nomsa@example.com",
            "status": "rejected", "is_verified": False, "review_note": "Invalid bank reference."
        }
    }

    print("--- Starting R120 Demo Seed ---")

    for slug, config in targets.items():
        profile = db.query(Profile).filter(Profile.slug == slug).first()
        if not profile:
            profile = Profile(
                id=str(uuid.uuid4()),
                slug=slug,
                name=config["name"],
                email=config["email"],
                owner_id=slug,
                onboarding_completed=True
            )
            db.add(profile)
            db.flush()

        profile.setup_fee_status = config["status"]
        profile.is_verified = config["is_verified"]
        
        if config["status"] == "approved":
            profile.activated_at = datetime.utcnow()
        elif config["status"] == "pending_review":
            profile.setup_fee_proof_url = config.get("proof_url")
        elif config["status"] == "rejected":
            profile.setup_fee_review_note = config.get("review_note")
        
        db.commit()
        print(f"[OK] {slug} updated to {config['status']}.")

    db.close()
    print("--- Seed Complete ---")

if __name__ == "__main__":
    seed_demo_users()
