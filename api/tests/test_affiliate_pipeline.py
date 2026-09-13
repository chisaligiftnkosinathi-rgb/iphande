import os
import sys
import uuid
from decimal import Decimal

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from fastapi.testclient import TestClient
from src.main import app
from src.database import SessionLocal
from src.models.lead_offer import AffiliateOffer, AffiliateLead
from src.models.continuity_event_model import ContinuityEvent
from src.models.profile import Profile
from src.auth.supabase_auth import get_current_user

client = TestClient(app)

TEST_MERCHANT_ID = f"test-merchant-{uuid.uuid4().hex[:8]}"

def override_current_user():
    return {
        "uid": TEST_MERCHANT_ID,
        "sub": TEST_MERCHANT_ID,
        "email": "merchant@test.com",
        "role": "merchant",
        "profile_id": "test-profile-001",
        "is_mock": True
    }

app.dependency_overrides[get_current_user] = override_current_user


def test_affiliate_pipeline():
    print("\n--- 1. Testing GET /api/v1/affiliates/offers ---")
    res = client.get("/api/v1/affiliates/offers")
    assert res.status_code == 200, f"Failed offers: {res.text}"
    offers = res.json()
    print(f"Total active offers returned: {len(offers)}")
    assert len(offers) >= 18, "Expected at least 18 seeded offers"

    # Grab Dis-Chem Funeral and Lime Loans
    dischem = next((o for o in offers if o["slug"] == "dischem-funeral"), None)
    lime = next((o for o in offers if o["slug"] == "lime-loans"), None)
    cartrack = next((o for o in offers if o["slug"] == "cartrack-dashcams"), None)

    assert dischem is not None
    assert lime is not None
    assert cartrack is not None
    print("[PASS] Catalog lookup verified (Dis-Chem Funeral, Lime Loans, Cartrack Dashcams found).")

    print("\n--- 2. Testing Pre-Qualification Disqualification (Income below R10k for Loans) ---")
    bad_loan_lead = {
        "offer_id": lime["id"],
        "first_name": "Sipho",
        "last_name": "Khumalo",
        "phone_number": f"083{uuid.uuid4().hex[:7]}",
        "monthly_income": 4500.00,  # Below R10,000 requirement
        "is_employed": True,
        "has_bank_account": True,
        "is_sa_citizen": True,
        "age": 30
    }
    res_bad = client.post("/api/v1/affiliates/leads/submit", json=bad_loan_lead)
    assert res_bad.status_code == 422, f"Expected 422 for low income, got: {res_bad.status_code}"
    print(f"[PASS] Pre-qualification successfully blocked unqualified applicant: {res_bad.json()['detail']}")

    print("\n--- 3. Testing Valid Lead Submission ---")
    test_phone = f"082{uuid.uuid4().hex[:7]}"
    valid_lead = {
        "offer_id": dischem["id"],
        "first_name": "Thabo",
        "last_name": "Mthembu",
        "phone_number": test_phone,
        "national_id": f"900101{uuid.uuid4().int % 10000000:07d}",
        "monthly_income": 6500.00,
        "is_employed": True,
        "has_bank_account": True,
        "is_sa_citizen": True,
        "age": 34
    }
    res_valid = client.post("/api/v1/affiliates/leads/submit", json=valid_lead)
    assert res_valid.status_code == 201, f"Expected 201, got: {res_valid.status_code} - {res_valid.text}"
    created_lead = res_valid.json()
    assert created_lead["status"] == "QUALIFIED"
    lead_id = created_lead["id"]
    print(f"[PASS] Lead successfully submitted and qualified: Lead ID = {lead_id}")

    print("\n--- 4. Testing 90-Day Deduplication Block ---")
    res_dup = client.post("/api/v1/affiliates/leads/submit", json=valid_lead)
    assert res_dup.status_code == 400, f"Expected 400 duplicate error, got: {res_dup.status_code}"
    print(f"[PASS] Duplicate submission correctly blocked by 90-day window: {res_dup.json()['detail']}")

    print("\n--- 5. Testing S2S Conversion Postback with 70% Merchant Commission Attribution ---")
    postback_payload = {
        "lead_id": lead_id,
        "status": "CONVERTED",
        "conversion_rate": 0.10,  # 10% CR -> Dischem Funeral tier = R60 gross payout
        "conversion_reference": "DISCHEM-CONV-998811"
    }
    res_postback = client.post("/api/v1/affiliates/postback", json=postback_payload)
    assert res_postback.status_code == 200, f"Postback failed: {res_postback.text}"
    converted_lead = res_postback.json()
    assert converted_lead["status"] == "CONVERTED"
    # R60 gross * 0.70 merchant split = R42.00 merchant commission, R18.00 platform fee
    assert float(converted_lead["gross_commission"]) == 60.00
    assert float(converted_lead["merchant_commission"]) == 42.00
    assert float(converted_lead["platform_fee"]) == 18.00
    print(f"[PASS] Conversion attributed! Gross: R{converted_lead['gross_commission']}, Merchant (70%): R{converted_lead['merchant_commission']}, Platform (30%): R{converted_lead['platform_fee']}")

    print("\n--- 6. Testing Merchant Commissions Ledger Hydration ---")
    res_ledger = client.get(f"/api/v1/commissions/business/{TEST_MERCHANT_ID}/ledger")
    assert res_ledger.status_code == 200, f"Ledger lookup failed: {res_ledger.text}"
    ledger_data = res_ledger.json()
    print(f"Merchant Commissions Ledger Output: {ledger_data}")
    assert "ZAR 42.00" in ledger_data["cashReality"]["commissionPaid"]
    print("[PASS] Merchant commissions ledger verified with instant ZAR 42.00 liquidity!")


if __name__ == "__main__":
    test_affiliate_pipeline()
