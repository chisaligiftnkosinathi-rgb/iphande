import sqlite3

db_path = "c:/Projects/iphande/api/iphande.db"

def migrate():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        cursor.execute("ALTER TABLE profiles ADD COLUMN is_verified BOOLEAN DEFAULT 0 NOT NULL;")
        print("Added is_verified column.")
    except sqlite3.OperationalError as e:
        print(f"is_verified already exists or error: {e}")
        
    try:
        cursor.execute("ALTER TABLE profiles ADD COLUMN activated_at DATETIME;")
        print("Added activated_at column.")
    except sqlite3.OperationalError as e:
        print(f"activated_at already exists or error: {e}")
        
    # Also update the default value for setup_fee_status for existing rows
    cursor.execute("UPDATE profiles SET setup_fee_status = 'not_submitted' WHERE setup_fee_status = 'pending' OR setup_fee_status IS NULL;")
    print("Updated existing setup_fee_status to 'not_submitted'.")
    
    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
