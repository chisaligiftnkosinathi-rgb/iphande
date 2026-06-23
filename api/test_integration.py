import jwt
import requests
import time

SECRET = "test_secret"
token = jwt.encode({"sub": "steward-123", "email": "steward@example.com", "alg": "HS256"}, SECRET, algorithm="HS256")

headers = {
    "Authorization": f"Bearer {token}"
}

payload = {
    "bucket_name": "proof-of-work",
    "public_url": "https://example.com/test-evidence.jpg",
    "purpose": "Roof repair completion",
    "profile_id": "steward-123"
}

print("Sending POST request to iPhande locally...")
resp = requests.post("http://127.0.0.1:8001/api/v1/media/evidence", json=payload, headers=headers)

print(f"iPhande Response Status: {resp.status_code}")
print(f"iPhande Response Body: {resp.text}")

print("Waiting a bit to allow the background task to hit Axionyx...")
time.sleep(2)
print("Check the Axionyx terminal (Task 225) to verify it received the request!")
