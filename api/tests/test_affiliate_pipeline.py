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

    print("\n--- 7. Testing HOSTAFRICA & EasyEquities Catalog Retrieval ---")
    hostafrica = next((o for o in offers if o["slug"] == "hostafrica-cloud-domains"), None)
    easyequities = next((o for o in offers if o["slug"] == "easyequities-invest"), None)
    assert hostafrica is not None, "HOSTAFRICA offer not found in catalog"
    assert easyequities is not None, "EasyEquities offer not found in catalog"
    assert hostafrica["category"] == "DIGITAL_TOOLS"
    assert easyequities["category"] == "WEALTH_AND_SAVINGS"
    assert hostafrica["affiliate_base_url"] == "https://my.hostafrica.com/aff.php?aff=3635"
    assert easyequities["affiliate_base_url"] == "https://bit.ly/3byDlco"
    print(f"[PASS] Digital Tools (HOSTAFRICA) & Wealth (EasyEquities) verified in catalog!")

    print("\n--- 8. Testing Dynamic Merchant Referral Link Generation ---")
    res_link = client.get("/api/v1/affiliates/referral-link/easyequities-invest")
    assert res_link.status_code == 200, f"Link generation failed: {res_link.text}"
    link_data = res_link.json()
    print(f"Generated EasyEquities Merchant Referral Link: {link_data['trackable_url']}")
    assert f"merchant_id={TEST_MERCHANT_ID}" in link_data["trackable_url"]
    assert "R50" in link_data["promotional_copy"]
    print("[PASS] Trackable link and promotional copy generated successfully.")

    print("\n--- 9. Testing Outbound Affiliate Click Redirection & Tracking ---")
    res_click = client.get(f"/api/v1/affiliates/click/hostafrica-cloud-domains?merchant_id={TEST_MERCHANT_ID}", follow_redirects=False)
    assert res_click.status_code == 302, f"Expected 302 redirect, got: {res_click.status_code}"
    redirect_loc = res_click.headers.get("location")
    print(f"HOSTAFRICA Redirection URL: {redirect_loc}")
    assert "aff=3635" in redirect_loc
    assert f"subid={TEST_MERCHANT_ID}" in redirect_loc
    print("[PASS] Outbound redirect correctly appends merchant sub_id parameter.")

    print("\n--- 10. Testing Admin Monthly Statement Ingestion (HOSTAFRICA R500 Reconciliation) ---")
    from src.auth.supabase_auth import require_supaadmin
    app.dependency_overrides[require_supaadmin] = override_current_user

    statement_payload = {
        "partner": "HOSTAFRICA",
        "reporting_period": "2026-09",
        "total_earnings": 500.00,
        "withdrawn_amount": 0.00,
        "total_visitors": 12,
        "new_signups": 2,
        "payout_account_id": "FNB-TREASURY-01",
        "notes": "Monthly referrals report verified from HOSTAFRICA affiliate portal"
    }
    res_stmt = client.post("/api/v1/affiliates/statements/ingest", json=statement_payload)
    assert res_stmt.status_code == 200, f"Statement ingest failed: {res_stmt.text}"
    stmt_data = res_stmt.json()
    assert float(stmt_data["total_earnings"]) == 500.00
    assert stmt_data["partner"] == "HOSTAFRICA"
    print(f"[PASS] HOSTAFRICA monthly statement reconciled: R{stmt_data['total_earnings']} auxiliary earnings recorded!")

    print("\n--- 11. Testing Mad Cars Automotive Multi-Monetization Funnel ---")
    vehicle_lead_payload = {
        "full_name": "Kabelo Dlamini",
        "phone_number": f"079{uuid.uuid4().hex[:7]}",
        "national_id": f"880505{uuid.uuid4().int % 10000000:07d}",
        "monthly_income": 16500.00,  # Qualifies for asset finance (>= R10k)
        "has_valid_license": True,    # Valid Code B
        "preferred_vehicle_type": "Polo Vivo Hatchback",
        "target_budget_range": "R3,000 - R4,500/pm",
        "email": "kabelo.dlamini@test.co.za",
        "age": 36,
        "is_employed": True,
        "has_bank_account": True,
        "is_sa_citizen": True,
        "opt_in_insurance_quote": True,  # Cross-sell: Car Insurance (R70)
        "opt_in_tracker": True,          # Cross-sell: Vehicle Tracker (R50)
        "opt_in_dashcam": True,          # Cross-sell: Cartrack Dashcam (R55)
        "opt_in_warranty": True          # Cross-sell: Motor Warranty (R50)
    }
    res_car = client.post("/api/v1/affiliates/leads/vehicle-inquiry", json=vehicle_lead_payload)
    assert res_car.status_code == 201, f"Vehicle inquiry failed: {res_car.text}"
    car_funnel = res_car.json()
    print(f"Vehicle Funnel Response: {car_funnel['message']}")
    print(f"Primary Lead: {car_funnel['primary_lead']['first_name']} {car_funnel['primary_lead']['last_name']} -> Status: {car_funnel['primary_lead']['status']}")
    print(f"Ancillary Cross-sell Leads Created: {len(car_funnel['ancillary_leads'])}")
    print(f"Total Funnel Potential Commission: R{car_funnel['total_potential_commission']}")
    print(f"Merchant 70% Share: R{car_funnel['merchant_potential_share']}")

    # R200 (Mad Cars) + R70 (Insurance) + R50 (Tracker) + R55 (Dashcam) + R50 (Warranty) = R425.00
    assert float(car_funnel["total_potential_commission"]) >= 425.00
    assert len(car_funnel["ancillary_leads"]) == 4
    print("[PASS] Mad Cars Dealership multi-monetization funnel verified with R425.00 full-chain potential!")


if __name__ == "__main__":
    test_affiliate_pipeline()
