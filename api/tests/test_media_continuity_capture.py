from fastapi.testclient import TestClient
from src.main import app
from src.auth.supabase_auth import get_current_user

app.dependency_overrides[get_current_user] = lambda: {"uid": "uid-123", "email": "test@example.com"}
client = TestClient(app)

def test_record_evidence_returns_media():
    payload = {
        "bucket_name": "proof-of-work",
        "public_url": "https://example.com/supabase/proof-of-work/123.jpg",
        "purpose": "Completed Job",
        "profile_id": "steward-123",
        "opportunity_id": "opp-123",
        "quote_id": None
    }
    response = client.post("/api/v1/media/evidence", json=payload)
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["owner_profile_id"] == "steward-123"
    assert data["file_url"] == "https://example.com/supabase/proof-of-work/123.jpg"
    assert data["media_type"] == "proof-of-work"

def test_reject_unsupported_bucket():
    payload = {
        "bucket_name": "random-bucket",
        "public_url": "https://example.com/123.jpg",
        "purpose": "Hacking",
        "profile_id": "steward-123"
    }
    response = client.post("/api/v1/media/evidence", json=payload)
    assert response.status_code == 400
    assert "Invalid bucket" in response.json()["detail"]
