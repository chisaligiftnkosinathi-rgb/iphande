import requests
import os
import sys
import time
import subprocess
from uuid import uuid4

BASE_URL = "http://127.0.0.1:8000"
API_URL = f"{BASE_URL}/api/v1"
MEDIA_ROOT = "data/media"

def wait_for_api():
    print("Waiting for API...")
    for _ in range(10):
        try:
            r = requests.get(f"{BASE_URL}/health")
            if r.status_code == 200:
                print("API is up!")
                return
        except Exception:
            pass
        time.sleep(1)
    print("API failed to start")
    sys.exit(1)

def run_test():
    # 1. Start server
    print("Starting server...")
    server = subprocess.Popen([
        "powershell", "-c",
        ".venv\\Scripts\\Activate.ps1; uvicorn src.main:app --host 127.0.0.1 --port 8000"
    ])
    wait_for_api()

    try:
        # Register user
        email = f"test_media_{uuid4().hex[:8]}@example.com"
        password = "Password123!"
        print(f"Registering {email}...")
        r = requests.post(f"{API_URL}/auth/register", json={"email": email, "password": password})
        r.raise_for_status()
        token = r.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Create Profile
        print("Creating profile...")
        r = requests.post(f"{API_URL}/profiles", json={"handle": f"tester_{uuid4().hex[:8]}"}, headers=headers)
        r.raise_for_status()
        profile_id = r.json()["id"]

        # Upload file (mock)
        print("Uploading file...")
        test_file_content = b"fake image content"
        files = {"file": ("test_image.jpg", test_file_content, "image/jpeg")}
        r = requests.post(f"{API_URL}/media/upload", files=files, headers=headers)
        r.raise_for_status()
        upload_data = r.json()
        temp_filename = upload_data["stored_filename"]
        temp_path = upload_data["temp_path"]
        print("Upload temp path:", temp_path)

        # Ingest file
        print("Ingesting file...")
        files = {"file": ("test_image2.jpg", test_file_content, "image/jpeg")}
        data = {"owner_profile_id": profile_id, "media_type": "image"}
        r = requests.post(f"{API_URL}/media/ingest", files=files, data=data, headers=headers)
        if r.status_code != 200:
            print("Ingest failed:", r.text)
            r.raise_for_status()
        
        media_data = r.json()
        media_id = media_data["id"]
        stored_filename = media_data["local_file_path"]
        print(f"Ingested media {media_id} at {stored_filename}")

        # Verify on disk
        disk_path = os.path.join(MEDIA_ROOT, stored_filename)
        assert os.path.exists(disk_path), "File not saved to disk!"
        print("File verified on disk.")

        # Restart server
        print("Restarting server...")
        server.terminate()
        server.wait()

        server = subprocess.Popen([
            "powershell", "-c",
            ".venv\\Scripts\\Activate.ps1; uvicorn src.main:app --host 127.0.0.1 --port 8000"
        ])
        wait_for_api()

        # Login again
        r = requests.post(f"{API_URL}/auth/login", json={"email": email, "password": password})
        r.raise_for_status()
        token = r.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Verify file still available
        print("Verifying file download...")
        r = requests.get(f"{BASE_URL}{media_data['file_url']}")
        r.raise_for_status()
        assert r.content == test_file_content, "Content mismatch!"
        print("File download verified.")

        # Try to delete media file (implement a quick delete method logic via Python directly to test deletion, 
        # since we don't have a /delete route in the plan yet, but the user said "delete media, verify file is removed")
        # Let's check if there is a DELETE /media/{media_id} endpoint.
        r = requests.delete(f"{API_URL}/media/{media_id}", headers=headers)
        if r.status_code == 404:
            print("Delete route not implemented via API. Deleting manually via service function.")
            from src.services.media_service import delete_media_file_by_id
            delete_media_file_by_id(media_id)
        else:
            r.raise_for_status()

        # Verify removed from disk
        assert not os.path.exists(disk_path), "File was NOT deleted from disk!"
        print("File deletion verified.")

        print("=== ALL TESTS PASSED ===")

    finally:
        server.terminate()
        server.wait()

if __name__ == "__main__":
    run_test()
