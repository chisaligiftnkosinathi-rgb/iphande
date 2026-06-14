from sqlalchemy import create_engine, text

DATABASE_URL = "postgresql://postgres.oxihvasgvldvusakfmsb:1997Nkosinathi@aws-0-eu-west-1.pooler.supabase.com:6543/postgres"
email = "antigravity.test.steward@gmail.com"

engine = create_engine(DATABASE_URL)
try:
    with engine.connect() as conn:
        res = conn.execute(text("SELECT id, email, onboarding_completed, setup_fee_status, owner_id FROM profiles WHERE email = :email"), {"email": email})
        row = res.fetchone()
        print("Found profile row:", row)
        
        if row:
            # Update
            conn.execute(
                text("UPDATE profiles SET onboarding_completed = True, setup_fee_status = 'approved', provider_type = 'Digital Steward / Systems Builder', business_category_key = 'tech_digital_services', business_line = 'Website Development' WHERE email = :email"),
                {"email": email}
            )
            conn.commit()
            print("Profile updated successfully!")
        else:
            # If not found, let's check auth.users table in Supabase!
            res_user = conn.execute(text("SELECT id FROM auth.users WHERE email = :email"), {"email": email})
            user_row = res_user.fetchone()
            print("Found auth.users row:", user_row)
            
            if user_row:
                uid = user_row[0]
                # Insert a profile row manually
                conn.execute(
                    text("""
                        INSERT INTO profiles (id, owner_id, email, name, slug, provider_type, business_category_key, business_line, onboarding_completed, setup_fee_status, location_is_public, setup_fee_required, is_public)
                        VALUES (:uid, :uid, :email, 'Antigravity Tech', 'antigravity-tech', 'Digital Steward / Systems Builder', 'tech_digital_services', 'Website Development', True, 'approved', True, 120.0, True)
                    """),
                    {"uid": str(uid), "email": email}
                )
                conn.commit()
                print("Profile inserted manually successfully!")
            else:
                print("User does not exist in auth.users yet. Please sign up or check why.")
except Exception as e:
    print("Database error:", e)
