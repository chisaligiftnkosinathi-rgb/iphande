import requests
import subprocess
import time
import uuid

API_URL = "http://127.0.0.1:8000/api/v1"

def start_api():
    print("Starting server in Pilot Mode...")
    proc = subprocess.Popen(
        ["powershell", "-c", ".venv\\Scripts\\Activate.ps1; uvicorn src.main:app --host 127.0.0.1 --port 8000"],
        cwd="C:\\Projects\\iphande\\api"
    )
    # wait for boot
    for _ in range(30):
        try:
            requests.get("http://127.0.0.1:8000/api/v1/health", timeout=1)
            print("API is ready!")
            return proc
        except:
            time.sleep(0.5)
    raise Exception("API did not start in time")

def kill_api(proc):
    print("Stopping API...")
    proc.terminate()
    proc.kill()
    proc.wait()

def test_pilot_session():
    proc = start_api()
    try:
        # 1. Test Endpoint Trimming
        res = requests.get(f"{API_URL}/opportunities")
        assert res.status_code == 404, f"Opportunities endpoint should be hidden in pilot mode, got {res.status_code}"
        print("[Pass] Complex endpoint returns 404")

        # 2. Test Error Message Standardization & support_trace_id
        res = requests.get(f"{API_URL}/profiles/me", headers={"Authorization": "Bearer bad_token"})
        assert res.status_code == 401
        data = res.json()
        assert "support_trace_id" in data, "support_trace_id missing from 401 response"
        assert data["detail"] == "Authentication required or invalid credentials.", f"Got detail: {data.get('detail')}"
        print("[Pass] 401 standard message and trace ID present")
        
        # 3. Rate limiting test
        email = f"pilot_{uuid.uuid4()}@test.com"
        for i in range(7):
            res = requests.post(f"{API_URL}/auth/register", json={
                "email": email,
                "password": "PilotPassword123!",
                "first_name": "Pilot",
                "last_name": "User"
            })
            if res.status_code == 429:
                break
        
        assert res.status_code == 429, "Rate limit not hit!"
        data = res.json()
        assert "support_trace_id" in data, "support_trace_id missing from 429 response"
        assert data["detail"] == "You're doing this too fast. Please wait a few seconds and try again."
        print(f"[Pass] Rate limit hit successfully with trace ID {data['support_trace_id']}")
        
        print("\nALL PILOT SESSION TESTS PASSED!")
    finally:
        kill_api(proc)

if __name__ == "__main__":
    test_pilot_session()
