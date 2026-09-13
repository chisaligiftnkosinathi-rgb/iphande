import requests
import uuid
import jwt
import os
import subprocess
import time
import sys

API_URL = "http://127.0.0.1:8000/api/v1"

GLOBAL_IT_PRIVATE_KEY = """-----BEGIN PRIVATE KEY-----
MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQC4QQysjMY+Epv1
q9cAEG6SEd+KVmD1FyYEK9+U4SFOzLDbirkN6d5fvfjj6Rf+v2yeDqyL6sMi+ZCh
u6ROA53kooNlcvvtvj7V0V81Ha+8UHHGtxABzXYPPECtDlXJMQ+SOblYjccvCewQ
PiIyLv84CRq0bMU7IOxGBmt0sofe9VMdxk11O0t5P6Sq/mOZOAlIiJTeAuVZ7K/j
JvCW8egXQznEqb4IAV3t3lKOPqt9IE8caWRTcXRzFuetwKm2fcItXazVHuvEdXk7
4BDsJ7gK4oXgGe9VIe1d8eOpw6IMc4Yuha1xbd8BWn0fIW1upCSfUEGNKKauWkTj
Ob2LqP91AgMBAAECggEABAPieiuHXpvQ6CNFqDPAREpQhOcTR4Wb94XN1Yr4l8so
N64kqh8a6gFNpSIzrc9VynXD5uwN/6f3S3Fd6BeC/C2nCUT4JMSbTm7SV6nTf7Oz
rJ9zIUyGqNgIvPl9vy7+QzlWTTRDvBLuVCYVrS9iGOjCR/goOrzILh6rZOVG4DUo
GI+GVtgDIF1D/DXASkPu7TfDL41BNqFV9OCYXG7cEfY1iDf98+QEJUGTzdII5sCj
atLBrOjieqZ1JfQKyRqGY4lT/OBp6y6kz9oQPKmociAgmJ9vPNvSQiSv/Asbcay2
Y5oILPtnX1UjI5D3r8FNjS/A7JGEWBEIp7Vvh1V7AQKBgQD/p/gFhqw3Kt/6GWXr
a3lUETo8bxgCEVZphtoxu4RLc7bOdxWpUCc5XqLSwzkwYTVlNMUIHV5Kb5dCuilw
qeecAJkkTcZUhaUpb9HyqyzCngu0f7zc67r0wclyAiNUebyP1pIskufLnybNt6ar
ca5RscZwZaXhqdNAS9qHF/bKdQKBgQC4gH6YGXHksRuM3vRhoC9MTJOLncs6otvh
kHZKGsyf0Rdnas9tfwsilW4y9Oox13sQuFCj77UTh3L0GUMuoFoMB19eG4+fTbLM
fHZbEdQoaqXp7x10BCG2tslodmntzTHdU4dh0fPrzEzJIqUvuQHi7+K5euRTZGnr
2xGEjtDBAQKBgQD6trCmSrHs0CEiVXH780Piy5o+1fvHW1VQ26xzBR/yFqJ5y5L0
neQ5gLNQ2Z7l8Q66F4v6L0Le4JyIFaS6FgVKmdOVJKiRDxcvkbdksbWNjgyQkIyY
YpzPlpOFOM+I8nGW5agoClFDAOq+55GNpEh9WUfvxd9tdGv1K+48eaXOWQKBgQC2
w9KjqNEB0c+QxGshKiSwWErwSuc+toVJ9Gi5D8MTrXSZpVzFAsxs/cmkAKjdpq7p
6Ss4ugONzOc6lqvOTFnnAIagGn0zOSydE83KeObJApxIF+39NvqOnJL3QBW+0z1K
GaxKYkhWlJKbzA4GMCaGP0tAoVP8p8OlN+Uqgq6YAQKBgQDpurZOAmxFgRssJZod
opR6Tv0DmHEp/ntoL0+i54ARnY7586iZ19SLwQpPaRej49q7K3WL1A0c4En1kSdp
T6VECx0CddXh10yRj7npylGpRUbuiHJduYTG4omhA1UoFwaOikuejGBCEADZnZKY
z1fZSNvcNnLWmSkc9N3lmkOxtg==
-----END PRIVATE KEY-----"""

import rsa
(pubkey, privkey) = rsa.newkeys(2048)
INVALID_PRIVATE_KEY = privkey.save_pkcs1().decode('utf-8')

def generate_s2s_token(tenant_id, private_key=GLOBAL_IT_PRIVATE_KEY, issuer="global-it", audience="iphande", exp_offset=300):
    payload = {
        "iss": issuer,
        "aud": audience,
        "sub": "global-it-service",
        "tenant_id": tenant_id,
        "iat": int(time.time()),
        "exp": int(time.time()) + exp_offset,
        "jti": str(uuid.uuid4())
    }
    return jwt.encode(payload, private_key, algorithm="RS256")

def test_s2s():
    try:
        tenant_a = uuid.uuid4().hex
        tenant_b = uuid.uuid4().hex
        
        print("\n--- Testing S2S Verification ---")
        
        print("Test 6: Invalid signature")
        bad_sig_token = generate_s2s_token(tenant_a, private_key=INVALID_PRIVATE_KEY)
        res = requests.post(f"{API_URL}/s2s/tenant-bootstrap", headers={"Authorization": f"Bearer {bad_sig_token}"})
        assert res.status_code == 401, f"Expected 401, got {res.status_code}: {res.text}"
        
        print("Test 7: Wrong issuer")
        bad_iss_token = generate_s2s_token(tenant_a, issuer="hacker")
        res = requests.post(f"{API_URL}/s2s/tenant-bootstrap", headers={"Authorization": f"Bearer {bad_iss_token}"})
        assert res.status_code == 401, f"Expected 401, got {res.status_code}: {res.text}"
        
        print("Test 8: Wrong audience")
        bad_aud_token = generate_s2s_token(tenant_a, audience="hacker-api")
        res = requests.post(f"{API_URL}/s2s/tenant-bootstrap", headers={"Authorization": f"Bearer {bad_aud_token}"})
        assert res.status_code == 401, f"Expected 401, got {res.status_code}: {res.text}"
        
        print("Test 9: Expired token")
        expired_token = generate_s2s_token(tenant_a, exp_offset=-100)
        res = requests.post(f"{API_URL}/s2s/tenant-bootstrap", headers={"Authorization": f"Bearer {expired_token}"})
        assert res.status_code == 401, f"Expected 401, got {res.status_code}: {res.text}"
        
        print("Test 10: Tenant A bootstrap idempotency")
        valid_token_a = generate_s2s_token(tenant_a)
        res1 = requests.post(f"{API_URL}/s2s/tenant-bootstrap", headers={"Authorization": f"Bearer {valid_token_a}"})
        assert res1.status_code == 200, f"Bootstrap failed: {res1.text}"
        data1 = res1.json()
        profile_a = data1["profile_id"]
        
        res2 = requests.post(f"{API_URL}/s2s/tenant-bootstrap", headers={"Authorization": f"Bearer {valid_token_a}"})
        assert res2.status_code == 200
        assert res2.json()["profile_id"] == profile_a
        
        print("Test 11: Tenant B bootstrap idempotency")
        valid_token_b = generate_s2s_token(tenant_b)
        res1 = requests.post(f"{API_URL}/s2s/tenant-bootstrap", headers={"Authorization": f"Bearer {valid_token_b}"})
        assert res1.status_code == 200, f"Bootstrap failed: {res1.text}"
        profile_b = res1.json()["profile_id"]
        
        res2 = requests.post(f"{API_URL}/s2s/tenant-bootstrap", headers={"Authorization": f"Bearer {valid_token_b}"})
        assert res2.status_code == 200
        assert res2.json()["profile_id"] == profile_b
        assert profile_a != profile_b
        
        print("Test 12: A -> A resource")
        res = requests.get(f"{API_URL}/profiles/me", headers={"Authorization": f"Bearer {valid_token_a}"})
        assert res.status_code == 200, f"A -> A resource failed: {res.text}"
        assert res.json()["id"] == profile_a
        
        print("Test 13: B -> B resource")
        res = requests.get(f"{API_URL}/profiles/me", headers={"Authorization": f"Bearer {valid_token_b}"})
        assert res.status_code == 200
        assert res.json()["id"] == profile_b
        
        print("Test 14: A -> B resource")
        quote_payload = {
            "business_owner_id": profile_b,
            "customer_request_id": None,
            "customer_name": "Test",
            "description": "Test quote",
            "amount": 100,
            "currency": "ZAR",
            "status": "issued"
        }
        res = requests.post(f"{API_URL}/quotes", headers={"Authorization": f"Bearer {valid_token_b}"}, json=quote_payload)
        assert res.status_code == 200, res.text
        quote_id = res.json()["id"]
        
        res = requests.get(f"{API_URL}/quotes/{quote_id}", headers={"Authorization": f"Bearer {valid_token_a}"})
        assert res.status_code == 403, f"A -> B resource should fail, got {res.status_code}"
        
        print("Test 15: B -> A resource")
        quote_payload["business_owner_id"] = profile_a
        res = requests.post(f"{API_URL}/quotes", headers={"Authorization": f"Bearer {valid_token_a}"}, json=quote_payload)
        quote_id_a = res.json()["id"]
        
        res = requests.get(f"{API_URL}/quotes/{quote_id_a}", headers={"Authorization": f"Bearer {valid_token_b}"})
        assert res.status_code == 403, f"B -> A resource should fail, got {res.status_code}"

        print("\nALL S2S ISOLATION TESTS PASSED")
    except Exception as e:
        print(f"Test failed: {e}")

if __name__ == "__main__":
    test_s2s()
