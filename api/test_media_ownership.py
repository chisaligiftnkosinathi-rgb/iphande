import requests
import uuid
import tempfile
import os

API_URL = "http://127.0.0.1:8000/api/v1"

def register(email, password):
    res = requests.post(f"{API_URL}/auth/register", json={"email": email, "password": password})
    return res.json().get("access_token")

def test():
    print("Setting up User A and User B...")
    email_a = f"usera_{uuid.uuid4()}@example.com"
    email_b = f"userb_{uuid.uuid4()}@example.com"
    token_a = register(email_a, "Password123!")
    token_b = register(email_b, "Password123!")
    
    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    print("\n--- Testing Media Ownership ---")
    
    # 1. User A bootstrap profile
    res = requests.post(f"{API_URL}/profiles/bootstrap", headers=headers_a)
    profile_a_id = res.json()["id"]
    print(f"User A Profile ID: {profile_a_id}")

    # 2. User B bootstrap profile
    res = requests.post(f"{API_URL}/profiles/bootstrap", headers=headers_b)
    profile_b_id = res.json()["id"]
    
    # Create dummy file
    fd, path = tempfile.mkstemp(suffix=".jpg")
    os.write(fd, b"fake image data")
    os.close(fd)

    # User A ingests media for their own profile
    with open(path, "rb") as f:
        res = requests.post(
            f"{API_URL}/media/ingest",
            headers=headers_a,
            data={"owner_profile_id": profile_a_id, "media_type": "image"},
            files={"file": ("test.jpg", f, "image/jpeg")}
        )
    if res.status_code != 200:
        print(f"User A ingest failed! {res.status_code} {res.text}")
        return
        
    media_id = res.json()["id"]
    print(f"User A created media: {media_id}")

    # User B tries to ingest media for User A's profile
    with open(path, "rb") as f:
        res = requests.post(
            f"{API_URL}/media/ingest",
            headers=headers_b,
            data={"owner_profile_id": profile_a_id, "media_type": "image"},
            files={"file": ("test.jpg", f, "image/jpeg")}
        )
    print(f"User B ingesting media for User A: {res.status_code}")
    if res.status_code != 403:
        print("  [FAIL]: User B should not be able to ingest media for User A")

    # User B tries to update User A's media
    res = requests.patch(
        f"{API_URL}/media/{media_id}",
        headers=headers_b,
        json={"title": "Hacked Title"}
    )
    print(f"User B updating User A's media: {res.status_code}")
    if res.status_code != 403:
        print("  [FAIL]: User B should not be able to edit User A's media")

    # User B tries to delete User A's media
    res = requests.delete(
        f"{API_URL}/media/{media_id}",
        headers=headers_b
    )
    print(f"User B deleting User A's media: {res.status_code}")
    if res.status_code != 403:
        print("  [FAIL]: User B should not be able to delete User A's media")
        
    os.remove(path)

if __name__ == "__main__":
    test()
