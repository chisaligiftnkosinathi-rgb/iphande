"""
Migration: Add proof_of_work_items column to profiles table.
Safe to run multiple times (uses IF NOT EXISTS).
"""
from sqlalchemy import create_engine, text

DATABASE_URL = "postgresql://postgres.oxihvasgvldvusakfmsb:1997Nkosinathi@aws-0-eu-west-1.pooler.supabase.com:6543/postgres"
engine = create_engine(DATABASE_URL)

migrations = [
    "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS proof_of_work_items TEXT",
    "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR",  # already exists, IF NOT EXISTS is safe
]

with engine.begin() as conn:
    for sql in migrations:
        try:
            conn.execute(text(sql))
            print(f"OK: {sql}")
        except Exception as e:
            print(f"SKIP ({e}): {sql}")

print("Migration complete.")
