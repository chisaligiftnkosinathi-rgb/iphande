import hashlib
import uuid
import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient

from src.main import app
from src.database import get_db, SessionLocal
from src.models.lead_offer import AffiliateOffer, AffiliateLead, PayoutModel, LeadStatus
from src.models.lead_document import LeadFICADocument, POPIAConsentLog, FICADocumentType, DocumentVerificationStatus

client = TestClient(app)

@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

def test_fica_popia_pipeline(db):
    # 1. Setup an eligible vehicle dealership inquiry lead
    unique_suffix = uuid.uuid4().hex[:8]
    id_num = f"9201015009{unique_suffix[:3]}"
    lead_id = uuid.uuid4()
    
    # Get or create offer
    offer = db.query(AffiliateOffer).filter(AffiliateOffer.slug == "mad-cars-dealership").first()
    offer_id = offer.id if offer else uuid.uuid4()

    # Create test lead
    lead = AffiliateLead(
        id=lead_id,
        merchant_id="merchant-fica-test",
        offer_id=offer_id,
        first_name="Themba",
        last_name="Zulu",
        phone_number=f"+2782{unique_suffix[:7]}",
        email=f"themba.{unique_suffix}@example.com",
        national_id=id_num,
        monthly_income=18000.0,
        is_employed=True,
        has_driver_license=True,
        status=LeadStatus.QUALIFIED.value,
        customer_metadata={"vehicle_interest": "2022 VW Polo Vivo", "has_drivers_license": True}
    )
    db.add(lead)
    db.commit()

    # 2. Gate Verification: Attempting upload-intent without POPIA consent MUST return 403 Forbidden
    resp_gate = client.post(
        f"/api/v1/affiliates/leads/{lead_id}/documents/upload-intent",
        json={
            "document_type": "SA_ID_DOCUMENT",
            "file_name": "smart_id_card.jpg",
            "file_size_bytes": 1024 * 500,
            "mime_type": "image/jpeg"
        }
    )
    assert resp_gate.status_code == 403
    assert "POPIA statutory consent required" in resp_gate.json()["detail"]

    # 3. POPIA Consent Ingestion
    consent_payload = {
        "id_number": id_num,
        "consented_to_credit_check": True,
        "consented_to_dealership_sharing": True,
        "consented_to_affiliate_forwarding": True,
        "consent_version": "POPIA-v1.0-2026",
        "raw_consent_text": "I explicitly consent to iPhande, Mad Cars, and vetted credit bureaus accessing my information solely for vehicle/credit pre-approval under POPIA Act 4 of 2013."
    }
    resp_consent = client.post(
        f"/api/v1/affiliates/leads/{lead_id}/consent",
        json=consent_payload
    )
    assert resp_consent.status_code == 201
    consent_data = resp_consent.json()
    assert consent_data["consented_to_credit_check"] is True
    assert consent_data["lead_id"] == str(lead_id)

    # 4. Now upload-intent MUST succeed and return pre-signed PUT slot
    resp_intent = client.post(
        f"/api/v1/affiliates/leads/{lead_id}/documents/upload-intent",
        json={
            "document_type": "SA_ID_DOCUMENT",
            "file_name": "smart_id_card.jpg",
            "file_size_bytes": 1024 * 500,
            "mime_type": "image/jpeg"
        }
    )
    assert resp_intent.status_code == 200
    intent_data = resp_intent.json()
    doc_id = intent_data["document_id"]
    upload_url = intent_data["upload_url"]
    assert "mock-upload" in upload_url
    assert intent_data["document_type"] == "SA_ID_DOCUMENT"

    # 5. Direct Mock Storage Upload simulation
    file_bytes = b"MOCK_ENCRYPTED_SMART_ID_BINARY_CONTENT"
    mock_upload_resp = client.put(upload_url, content=file_bytes)
    assert mock_upload_resp.status_code == 200

    # 6. Confirm upload with SHA-256 Checksum
    expected_hash = hashlib.sha256(file_bytes).hexdigest()
    resp_confirm = client.post(
        f"/api/v1/affiliates/leads/{lead_id}/documents/{doc_id}/confirm",
        json={"sha256_checksum": expected_hash}
    )
    assert resp_confirm.status_code == 200
    confirm_data = resp_confirm.json()
    assert confirm_data["verification_status"] == "VERIFIED"
    assert confirm_data["sha256_checksum"] == expected_hash

    # 7. List documents for lead
    resp_list = client.get(f"/api/v1/affiliates/leads/{lead_id}/documents")
    assert resp_list.status_code == 200
    docs = resp_list.json()
    assert len(docs) == 1
    assert docs[0]["id"] == doc_id

    # 8. Request time-limited signed view URL
    resp_signed = client.get(f"/api/v1/affiliates/leads/{lead_id}/documents/{doc_id}/signed-url")
    assert resp_signed.status_code == 200
    signed_data = resp_signed.json()
    assert "mock-view" in signed_data["signed_view_url"]
    assert signed_data["expires_in_seconds"] == 900

    # 9. Test POPIA Retention Purge Worker
    # Mark lead as REJECTED and set document created_at to 95 days ago
    past_date = datetime.now(timezone.utc) - timedelta(days=95)
    doc_in_db = db.query(LeadFICADocument).filter(LeadFICADocument.id == uuid.UUID(doc_id)).first()
    lead_in_db = db.query(AffiliateLead).filter(AffiliateLead.id == lead_id).first()
    lead_in_db.status = LeadStatus.REJECTED.value
    doc_in_db.created_at = past_date
    db.commit()

    purge_resp = client.post("/api/v1/affiliates/leads/documents/purge-expired?retention_days=90")
    assert purge_resp.status_code == 200
    assert purge_resp.json()["purged_count"] >= 1

    # Verify doc is now PURGED
    db.refresh(doc_in_db)
    assert doc_in_db.verification_status == DocumentVerificationStatus.PURGED
    assert doc_in_db.storage_key == "[PURGED_UNDER_POPIA]"
    assert doc_in_db.purged_at is not None

    # Attempting to fetch signed URL on purged document returns 410 Gone
    resp_purged_view = client.get(f"/api/v1/affiliates/leads/{lead_id}/documents/{doc_id}/signed-url")
    assert resp_purged_view.status_code == 410
