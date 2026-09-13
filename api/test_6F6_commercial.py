import os
import requests
import json
import jwt
import time
from dotenv import load_dotenv

load_dotenv()

BASE_URL = "http://127.0.0.1:8000/api/v1"

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

COMPLIANCE_EMAIL = "compliance@globalitbusiness.co.za"
ASSESSMENT_EMAIL = "assessment@globalitbusiness.co.za"

def generate_s2s_token(tenant_email: str) -> str:
    payload = {
        "iss": "global-it",
        "aud": "iphande",
        "sub": "global-it-orchestrator",
        "tenant_id": tenant_email,
        "iat": int(time.time()),
        "exp": int(time.time()) + 3600
    }
    return jwt.encode(payload, GLOBAL_IT_PRIVATE_KEY, algorithm="RS256")

def bootstrap_tenant(email: str):
    token = generate_s2s_token(email)
    res = requests.post(f"{BASE_URL}/s2s/tenant-bootstrap", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    return res.json()["profile_id"]

def run_tests():
    print("--- 6F.6 Commercial Lifecycle Certification ---")
    
    compliance_id = bootstrap_tenant(COMPLIANCE_EMAIL)
    assessment_id = bootstrap_tenant(ASSESSMENT_EMAIL)
    
    token_comp = generate_s2s_token(COMPLIANCE_EMAIL)
    token_assess = generate_s2s_token(ASSESSMENT_EMAIL)

    headers_comp = {"Authorization": f"Bearer {token_comp}"}
    headers_assess = {"Authorization": f"Bearer {token_assess}"}

    # 1. Missing / Invalid token
    res = requests.get(f"{BASE_URL}/profiles/me", headers={"Authorization": f"Bearer invalid"})
    print(f"Missing/invalid token -> {res.status_code}")
    assert res.status_code == 401

    # 2. Opportunity Creation (Compliance)
    opp_payload = {
        "created_by_profile_id": compliance_id,
        "title": "Fix Server",
        "description": "Server is down",
        "service_needed": "IT Support",
        "province": "Gauteng",
        "town_or_city": "Johannesburg",
        "category_key": "it_support",
        "contact_name": "John Doe",
        "contact_phone": "0821234567"
    }
    res = requests.post(f"{BASE_URL}/opportunities", json=opp_payload, headers=headers_comp)
    print(f"Compliance creates opp -> {res.status_code}")
    assert res.status_code == 200 or res.status_code == 201
    opp_id = res.json()["id"]

    # 3. Opportunity Read (Compliance -> 200, Assessment -> 403)
    res = requests.get(f"{BASE_URL}/opportunities/{opp_id}", headers=headers_comp)
    print(f"Compliance reads opp -> {res.status_code}")
    assert res.status_code == 200

    res = requests.get(f"{BASE_URL}/opportunities/{opp_id}", headers=headers_assess)
    print(f"Assessment reads Compliance opp -> {res.status_code}")
    assert res.status_code == 403

    # 4. Assessment modifies Compliance Opportunity -> 403
    res = requests.patch(f"{BASE_URL}/opportunities/{opp_id}", json={"status": "contacted"}, headers=headers_assess)
    print(f"Assessment modifies Compliance opp -> {res.status_code}")
    assert res.status_code == 403

    # 5. Quote Creation (Compliance)
    quote_payload = {
        "business_owner_id": compliance_id,
        "customer_name": "Acme Corp",
        "description": "Server Fix",
        "amount": 1500.00,
        "currency": "ZAR",
        "opportunity_id": opp_id
    }
    res = requests.post(f"{BASE_URL}/quotes", json=quote_payload, headers=headers_comp)
    print(f"Compliance creates quote -> {res.status_code}")
    assert res.status_code == 200 or res.status_code == 201
    quote_id = res.json()["id"]

    # 6. Assessment modifies Compliance Quote -> 403 (send)
    res = requests.post(f"{BASE_URL}/quotes/{quote_id}/send", headers=headers_assess)
    print(f"Assessment sends Compliance quote -> {res.status_code}")
    assert res.status_code == 403

    # 7. Assessment accepts Compliance quote -> 403
    res = requests.post(f"{BASE_URL}/quotes/{quote_id}/accept", headers=headers_assess)
    print(f"Assessment accepts Compliance quote -> {res.status_code}")
    assert res.status_code == 403

    # 8. Compliance accepts own quote -> success
    res = requests.post(f"{BASE_URL}/quotes/{quote_id}/accept", headers=headers_comp)
    print(f"Compliance accepts own quote -> {res.status_code}")
    assert res.status_code == 200

    # 9. Invalid state transition (send accepted quote -> 409)
    res = requests.post(f"{BASE_URL}/quotes/{quote_id}/send", headers=headers_comp)
    print(f"Invalid state transition (send accepted quote) -> {res.status_code}")
    assert res.status_code == 409

    # 10. Duplicate commercial action -> idempotent
    res = requests.post(f"{BASE_URL}/quotes/{quote_id}/accept", headers=headers_comp)
    print(f"Duplicate acceptance -> {res.status_code} (idempotent)")
    assert res.status_code == 200

    # 11. Financial Event Creation
    fin_payload = {
        "business_owner_id": compliance_id,
        "event_type": "income_received",
        "amount": 1500.00,
        "description": "Server fix payment",
        "occurred_at": "2023-10-01T12:00:00Z",
        "accounting_category": "Income"
    }
    
    headers_comp_fin = dict(headers_comp)
    headers_comp_fin["Idempotency-Key"] = "req-12345"

    res = requests.post(f"{BASE_URL}/financial-events", json=fin_payload, headers=headers_comp_fin)
    print(f"Compliance creates financial event -> {res.status_code}")
    assert res.status_code == 200

    # Idempotent financial event creation
    res2 = requests.post(f"{BASE_URL}/financial-events", json=fin_payload, headers=headers_comp_fin)
    print(f"Idempotent financial event creation -> {res2.status_code}")
    assert res2.status_code == 200
    assert res.json()["id"] == res2.json()["id"]

    # 12. Assessment accesses financial event -> 403
    res = requests.get(f"{BASE_URL}/financial-events/business/{compliance_id}", headers=headers_assess)
    print(f"Assessment lists Compliance financial events -> {res.status_code}")
    assert res.status_code == 403

    res = requests.get(f"{BASE_URL}/financial-events/business/{compliance_id}/profit-snapshot", headers=headers_assess)
    print(f"Assessment accesses Compliance profit snapshot -> {res.status_code}")
    assert res.status_code == 403

    # 13. Payment Lifecycle
    payment_payload = {
        "quote_id": quote_id,
        "provider_name": "demo_provider",
        "payer_reference": "REF123"
    }

    # Assessment creates intent for Compliance quote -> 403 (wait, quote doesn't belong to them)
    # create_payment_intent checks if quote belongs to the business owner and we pass business_owner_id...
    # Oh wait, create_payment_intent extracts business_owner_id from quote_id.
    # So if Assessment passes Compliance's quote_id, verify_tenant_access will check if Assessment owns Compliance's business_owner_id, which is 403!
    res = requests.post(f"{BASE_URL}/payments/intents", json=payment_payload, headers=headers_assess)
    print(f"Assessment creates payment intent for Compliance -> {res.status_code} {res.text}")
    assert res.status_code == 403

    # Compliance creates intent
    res = requests.post(f"{BASE_URL}/payments/intents", json=payment_payload, headers=headers_comp)
    print(f"Compliance creates payment intent -> {res.status_code}")
    assert res.status_code == 200
    payment_id = res.json()["id"]

    # Assessment uploads receipt -> 403
    # We use a dummy file upload
    files = {"receipt_file": ("test.png", b"dummy", "image/png")}
    res = requests.post(f"{BASE_URL}/payments/intents/{payment_id}/receipt-upload", files=files, headers=headers_assess)
    print(f"Assessment uploads receipt -> {res.status_code}")
    assert res.status_code == 403

    # Compliance uploads receipt -> 200
    files = {"receipt_file": ("test.png", b"dummy", "image/png")}
    res = requests.post(f"{BASE_URL}/payments/intents/{payment_id}/receipt-upload", files=files, headers=headers_comp)
    print(f"Compliance uploads receipt -> {res.status_code}")
    assert res.status_code == 200

    # Assessment submits proof -> 403
    proof_payload = {
        "file_name": "test.png",
        "file_type": "image/png",
        "uploaded_by": "business_owner",
        "extracted_amount": 1500.00,
        "extracted_reference": "REF123",
        "payer_name": "Acme Corp",
        "account_info_present": True,
        "notes": "Looks good"
    }
    res = requests.post(f"{BASE_URL}/payments/intents/{payment_id}/proofs", json=proof_payload, headers=headers_assess)
    print(f"Assessment submits proof -> {res.status_code}")
    assert res.status_code == 403

    # Compliance submits proof -> 200
    res = requests.post(f"{BASE_URL}/payments/intents/{payment_id}/proofs", json=proof_payload, headers=headers_comp)
    print(f"Compliance submits proof -> {res.status_code}")
    assert res.status_code == 200

    # Assessment verifies payment -> 403
    res = requests.post(f"{BASE_URL}/payments/intents/{payment_id}/verify", headers=headers_assess)
    print(f"Assessment verifies payment -> {res.status_code}")
    assert res.status_code == 403

    # Compliance verifies payment -> 200
    res = requests.post(f"{BASE_URL}/payments/intents/{payment_id}/verify", headers=headers_comp)
    print(f"Compliance verifies payment -> {res.status_code}")
    assert res.status_code == 200

    # Assessment confirms demo payment -> 403
    res = requests.post(f"{BASE_URL}/payments/{payment_id}/confirm-demo", headers=headers_assess)
    print(f"Assessment confirms demo payment -> {res.status_code}")
    assert res.status_code == 403

    # Compliance confirms demo payment -> 200
    res = requests.post(f"{BASE_URL}/payments/{payment_id}/confirm-demo", headers=headers_comp)
    print(f"Compliance confirms demo payment -> {res.status_code}")
    assert res.status_code == 200

    # Verify that a financial event was generated from confirm-demo
    res = requests.get(f"{BASE_URL}/financial-events/business/{compliance_id}", headers=headers_comp)
    events = res.json()
    print("Events:", events)
    assert any(e["event_type"] == "income_received" and float(e["amount"]) == 1500.00 and e["source_actor"] == "demo_payment_confirmer" for e in events)

    print("ALL 6F.6 TESTS PASSED!")

if __name__ == "__main__":
    run_tests()
