import sys
from sqlalchemy import create_engine, text

if len(sys.argv) < 2:
    print("Usage: python approve_profile.py <email>")
    sys.exit(1)

email = sys.argv[1]
DATABASE_URL = "postgresql://postgres.oxihvasgvldvusakfmsb:1997Nkosinathi@aws-0-eu-west-1.pooler.supabase.com:6543/postgres"

engine = create_engine(DATABASE_URL)
try:
    with engine.connect() as conn:
        # Check if profile exists
        res = conn.execute(text("SELECT id, email, onboarding_completed, setup_fee_status FROM profiles WHERE email = :email"), {"email": email})
        profile = res.fetchone()
        if not profile:
            print(f"Profile for {email} not found.")
            sys.exit(1)
        
        print("Before:", profile)
        
        # Update profile to approved and onboarding completed
        conn.execute(
            text("UPDATE profiles SET onboarding_completed = True, setup_fee_status = 'approved' WHERE email = :email"),
            {"email": email}
        )
        conn.commit()
        
        # Check after update
        res = conn.execute(text("SELECT id, email, onboarding_completed, setup_fee_status FROM profiles WHERE email = :email"), {"email": email})
        print("After:", res.fetchone())
        print("Successfully approved profile!")
except Exception as e:
    print("Database error:", e)
