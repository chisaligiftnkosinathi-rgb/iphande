import requests
import uuid
import jwt
from datetime import datetime, timedelta

def test():
    print("Testing Registration...")
    unique_email = f"test_{uuid.uuid4()}@example.com"
    password = "Password123!"
    
    res = requests.post("http://127.0.0.1:8000/api/v1/auth/register", json={
        "email": unique_email,
        "password": password
    })
    print(f"Register OK: {res.status_code}")
    
    if res.status_code == 200:
        token = res.json().get("access_token")
    else:
        return

    print("Testing Duplicate Email...")
    res = requests.post("http://127.0.0.1:8000/api/v1/auth/register", json={
        "email": unique_email,
        "password": password
    })
    print(f"Duplicate Email: {res.status_code} {res.text}")
    
    print("Testing Login...")
    res = requests.post("http://127.0.0.1:8000/api/v1/auth/login", json={
        "email": unique_email,
        "password": password
    })
    print(f"Login OK: {res.status_code}")
    
    print("Testing Login Invalid Password...")
    res = requests.post("http://127.0.0.1:8000/api/v1/auth/login", json={
        "email": unique_email,
        "password": "WrongPassword123!"
    })
    print(f"Login Invalid Password: {res.status_code} {res.text}")

    print("Testing Protected Route (Valid JWT)...")
    headers = {"Authorization": f"Bearer {token}"}
    res = requests.get("http://127.0.0.1:8000/api/v1/profiles/me", headers=headers)
    print(f"Valid JWT: {res.status_code}")

    print("Testing Missing JWT...")
    res = requests.get("http://127.0.0.1:8000/api/v1/profiles/me")
    print(f"Missing JWT: {res.status_code} {res.text}")

    print("Testing Invalid JWT...")
    headers = {"Authorization": f"Bearer {token}INVALID"}
    res = requests.get("http://127.0.0.1:8000/api/v1/profiles/me", headers=headers)
    print(f"Invalid JWT: {res.status_code} {res.text}")

    print("Testing Expired JWT...")
    import os
    # We need the secret key to forge an expired token for the same user
    # If we don't have it, we just create a random one, but that would fail signature
    # Let's just create an invalid signature one if we can't access the secret.
    # We can't access the server's env vars easily from this client script, so we'll test invalid signature.
    # The server uses "CHANGE_THIS_TO_ENV_SECRET" as default but we changed it to fail without env var.
    # Let's assume the script can't forge it perfectly, but we'll try with a known dummy secret if we set it.

if __name__ == "__main__":
    test()
