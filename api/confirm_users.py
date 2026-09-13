from sqlalchemy import create_engine, text

DATABASE_URL = "postgresql://postgres.oxihvasgvldvusakfmsb:1997Nkosinathi@aws-0-eu-west-1.pooler.supabase.com:6543/postgres"
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    result = conn.execute(text("UPDATE auth.users SET email_confirmed_at = now() WHERE email IN ('certification-a@globalitbusiness.co.za', 'certification-b@globalitbusiness.co.za', 'compliance@globalitbusiness.co.za', 'assessment@globalitbusiness.co.za') RETURNING email;"))
    for row in result:
        print(f"Confirmed: {row[0]}")
    conn.commit()
