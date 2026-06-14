import sqlite3
import os

DB_PATH = "iphande.db"

def migrate():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        cursor.execute("ALTER TABLE profiles ADD COLUMN company_logo_url VARCHAR;")
        print("Successfully added company_logo_url to profiles table.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("Column company_logo_url already exists.")
        else:
            print(f"Error: {e}")
            
    conn.commit()
    conn.close()

if __name__ == "__main__":
    migrate()
