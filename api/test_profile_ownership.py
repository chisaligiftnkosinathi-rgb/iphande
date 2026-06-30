import requests
import uuid

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

    print("\n--- Testing Profile Ownership ---")
    
    # 1. User A bootstrap profile
    res = requests.post(f"{API_URL}/profiles/bootstrap", headers=headers_a)
    profile_a_id = res.json()["id"]
    print(f"User A Profile ID: {profile_a_id}")

    # 2. User B tries to update User A's visibility
    res = requests.patch(
        f"{API_URL}/profiles/{profile_a_id}/visibility",
        headers=headers_b,
        json={"name": "Hacked by User B!"}
    )
    print(f"User B updating User A's visibility: {res.status_code}")
    if res.status_code != 403:
        print("  [FAIL]: User B should not be able to edit User A's profile")

    # 3. User B tries to update User A's location
    res = requests.patch(
        f"{API_URL}/profiles/{profile_a_id}/location",
        headers=headers_b,
        json={"latitude": 1.0, "longitude": 1.0}
    )
    print(f"User B updating User A's location: {res.status_code}")
    if res.status_code != 403:
        print("  [FAIL]: User B should not be able to edit User A's location")

    # 4. User B tries to get User A's private profile information (e.g. by owner_id or ID)
    res = requests.get(f"{API_URL}/profiles/by-owner/{res.json().get('owner_id', 'unknown')}", headers=headers_b)
    # Actually wait, if the profile is public, it might be allowed. But the internal `/profiles/{id}` might expose private info?
    # Let's check the code: get_profile doesn't enforce ownership, but it uses ProfileOut_with_privacy.
    # We will test edit for now.

if __name__ == "__main__":
    test()
