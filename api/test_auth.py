import requests
import uuid

def test():
    print("Testing Registration...")
    unique_email = f"test_{uuid.uuid4()}@example.com"
    res = requests.post("http://127.0.0.1:8000/api/v1/auth/register", json={
        "email": unique_email,
        "password": "Password123!"
    })
    print(res.status_code, res.text)
    
    if res.status_code == 200:
        token = res.json().get("access_token")
    else:
        return

    print("Testing Login...")
    res = requests.post("http://127.0.0.1:8000/api/v1/auth/login", json={
        "email": unique_email,
        "password": "Password123!"
    })
    print(res.status_code, res.text)
    
    print("Testing Protected Route...")
    headers = {"Authorization": f"Bearer {token}"}
    res = requests.get("http://127.0.0.1:8000/api/v1/profiles/me", headers=headers)
    print(res.status_code, res.text)

if __name__ == "__main__":
    test()
