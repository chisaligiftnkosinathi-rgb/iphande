import requests
import uuid
import tempfile
import os
import subprocess
import time
import sys

API_URL = "http://127.0.0.1:8000/api/v1"

def start_api():
    print("[SYSTEM] Starting API...")
    # Start uvicorn as a subprocess directly to ensure it terminates cleanly
    proc = subprocess.Popen(
        [".venv\\Scripts\\uvicorn.exe", "src.main:app", "--host", "127.0.0.1", "--port", "8000"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    
    # Wait for it to be ready
    for i in range(30):
        try:
            res = requests.get("http://127.0.0.1:8000/api/v1/health")
            if res.status_code == 200:
                print("[SYSTEM] API is ready!")
                return proc
        except requests.exceptions.ConnectionError:
            pass
        time.sleep(1)
        
    print("[SYSTEM] API failed to start in time.")
    proc.kill()
    sys.exit(1)

def kill_api(proc):
    print("[SYSTEM] Stopping API...")
    proc.terminate()
    proc.wait()

def test():
    email = f"golden_{uuid.uuid4()}@example.com"
    password = "GoldenPassword123!"
    
    # --- PHASE 1 ---
    proc = start_api()
    try:
        print("\n=== PHASE 1: Initial Journey ===")
        
        print("1. Create Account (Register)")
        res = requests.post(f"{API_URL}/auth/register", json={"email": email, "password": password})
        assert res.status_code == 200, f"Register failed: {res.text}"
        
        print("2. Login")
        res = requests.post(f"{API_URL}/auth/login", json={"email": email, "password": password})
        assert res.status_code == 200, f"Login failed: {res.text}"
        token = res.json().get("access_token")
        headers = {"Authorization": f"Bearer {token}"}
        
        print("3. Create Profile")
        res = requests.post(f"{API_URL}/profiles/bootstrap", headers=headers)
        assert res.status_code == 200, f"Bootstrap failed: {res.text}"
        profile_id = res.json()["id"]
        
        print("4. Update Profile")
        res = requests.patch(f"{API_URL}/profiles/me", headers=headers, json={"name": "Golden User"})
        assert res.status_code == 200, f"Update Profile failed: {res.text}"
        assert res.json()["name"] == "Golden User"
        
        print("5. Upload Media")
        fd, path = tempfile.mkstemp(suffix=".jpg")
        os.write(fd, b"fake image data")
        os.close(fd)
        
        with open(path, "rb") as f:
            res = requests.post(
                f"{API_URL}/media/ingest",
                headers=headers,
                data={"owner_profile_id": profile_id, "media_type": "image"},
                files={"file": ("golden.jpg", f, "image/jpeg")}
            )
        os.remove(path)
        assert res.status_code == 200, f"Upload Media failed: {res.text}"
        media_id = res.json()["id"]
        
        print("6. Retrieve Media")
        res = requests.get(f"{API_URL}/media/{media_id}")
        assert res.status_code == 200, f"Retrieve Media failed: {res.text}"
        
        print("\n=== PHASE 2: Restart and Verify ===")
        kill_api(proc)
        
        proc = start_api()
        
        print("7. Login Again")
        res = requests.post(f"{API_URL}/auth/login", json={"email": email, "password": password})
        assert res.status_code == 200, f"Login Again failed: {res.text}"
        token = res.json().get("access_token")
        headers = {"Authorization": f"Bearer {token}"}
        
        print("8. Retrieve Profile")
        res = requests.get(f"{API_URL}/profiles/me", headers=headers)
        assert res.status_code == 200, f"Retrieve Profile failed: {res.text}"
        assert res.json()["name"] == "Golden User", "Profile data did not persist!"
        
        print("9. Retrieve Media")
        res = requests.get(f"{API_URL}/media/{media_id}")
        assert res.status_code == 200, f"Retrieve Media after restart failed: {res.text}"
        
        print("10. Attempt Protected Endpoint without JWT")
        res = requests.get(f"{API_URL}/profiles/me")
        assert res.status_code in [401, 403], f"Protected endpoint accessible without auth: {res.status_code}"
        
        print("\n GOLDEN PATH PASSED SUCCESSFULLY!")
        
    finally:
        kill_api(proc)

if __name__ == "__main__":
    test()
