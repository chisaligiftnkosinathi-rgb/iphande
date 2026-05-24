import sqlite3
import urllib.request
import json
import os

# Derive the absolute path matching database.py logic
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "data", "iphande.db")

def verify_timeline_read():
    print(f"🔍 Inspecting correct SQLite database at: {DB_PATH}")

    if not os.path.exists(DB_PATH):
        print("❌ Database file not found. Ensure the API has been started and data folder exists.")
        return

    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        # 1. Query the latest content post ID
        cursor.execute("""
        SELECT id, business_line
        FROM content_posts
        ORDER BY created_at DESC
        LIMIT 1
        """)

        result = cursor.fetchone()

        if not result:
            print("❌ No content posts found in DB. Generate a post first via the app or API.")
            conn.close()
            return

        content_post_id, business_line = result
        print(f"✅ Found latest Content Post ID: {content_post_id} (Line: '{business_line}')")

        # 2. Call the read-only timeline endpoint
        url = f"http://127.0.0.1:8000/api/v1/content-posts/{content_post_id}/timeline"
        print(f"🌐 Fetching replay timeline from: {url}\n")

        req = urllib.request.Request(url, method="GET")
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            print("🟢 API Response Success! Timeline data:")
            print(json.dumps(data, indent=2))

            # 3. Check event count boundary rules
            event_count = data.get("event_count", 0)
            print(f"\n📊 Evaluated Event Count: {event_count}")

            if event_count == 0:
                print("⚠️ Event count returned 0. Inspecting `continuity_events` directly for missing lineage...")

                cursor.execute("""
                SELECT id, event_type, created_at
                FROM continuity_events
                WHERE related_entity_type = 'content_post'
                AND related_entity_id = ?
                ORDER BY created_at ASC
                """, (content_post_id,))

                events = cursor.fetchall()
                if not events:
                    print(f"❌ DB Confirmation: No events actually exist for content_post_id: {content_post_id}.")
                else:
                    print(f"✅ DB Mismatch Found: {len(events)} events exist in DB but failed to surface via API.")
                    for ev in events:
                        print(f"  -> {ev}")
            else:
                print("✅ Timeline endpoint successfully verified read-only replay lineage!")

        conn.close()

    except sqlite3.Error as e:
        print(f"❌ Database error: {e}")
    except urllib.error.URLError as e:
        print(f"❌ API Request failed. Is your backend running on port 8000? Error: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

if __name__ == "__main__":
    verify_timeline_read()
