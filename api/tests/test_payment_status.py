import pytest
from fastapi.testclient import TestClient

def test_payment_status_endpoint(client: TestClient, db_session, test_user, auth_headers):
    # GET /profiles/me
    profile_response = client.get("/api/v1/profiles/me", headers=auth_headers)
    assert profile_response.status_code == 200
    
    # GET /profiles/me/payment-status
    payment_status_response = client.get("/api/v1/profiles/me/payment-status", headers=auth_headers)
    assert payment_status_response.status_code == 200
    data = payment_status_response.json()
    
    assert "setup_fee_status" in data
    assert "is_verified" in data
    assert "setup_fee_proof_url" in data
    assert "setup_fee_review_note" in data
    assert "activated_at" in data
