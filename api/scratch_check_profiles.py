from sqlalchemy import create_engine, text

DATABASE_URL = "postgresql://postgres.oxihvasgvldvusakfmsb:1997Nkosinathi@aws-0-eu-west-1.pooler.supabase.com:6543/postgres"

engine = create_engine(DATABASE_URL)
try:
    with engine.connect() as conn:
        res = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles'"))
        cols = [r[0] for r in res]
        print("Columns in profiles:", cols)
        
        # Query first few profiles with the available columns
        res2 = conn.execute(text(f"SELECT email, onboarding_completed, setup_fee_status FROM profiles LIMIT 20"))
        for r2 in res2:
            print(r2)
except Exception as e:
    print("Database error:", e)
