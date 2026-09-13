import pytest
import logging
import json
import uuid
import datetime
from decimal import Decimal
from unittest.mock import patch
from io import StringIO
from fastapi.testclient import TestClient

from src.main import app
from src.database import SessionLocal, Base, engine
from src.models.profile import Profile
from src.core.logging import JsonFormatter, request_id_context, user_id_context

@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()

@pytest.fixture
def setup_tenants(db):
    tenant_a = Profile(id="tenant_obs_a", owner_id="tenant_obs_a", email="obs_a@example.com", name="Obs A", slug="obs-a", trust_posture="system_creator")
    db.merge(tenant_a)
    db.commit()
    return {"A": tenant_a.id}

@pytest.fixture
def capture_logs():
    logger = logging.getLogger()
    original_level = logger.level
    logger.setLevel(logging.INFO)
    
    stream = StringIO()
    handler = logging.StreamHandler(stream)
    handler.setFormatter(JsonFormatter())
    logger.addHandler(handler)
    
    yield stream
    
    logger.removeHandler(handler)
    logger.setLevel(original_level)

@pytest.fixture
def auth_mock():
    def override_get_current_user():
        return {"uid": "tenant_obs_a", "email": "obs_a@example.com"}

    import src.services.verification_service
    original_require = src.services.verification_service.require_verified_steward_or_platform_admin
    src.services.verification_service.require_verified_steward_or_platform_admin = lambda p: p

    from src.auth.supabase_auth import get_current_user
    app.dependency_overrides[get_current_user] = override_get_current_user
    yield
    app.dependency_overrides.pop(get_current_user, None)
    src.services.verification_service.require_verified_steward_or_platform_admin = original_require

def test_sanitization_and_payload_discipline(capture_logs):
    """
    Test 4 & 5: Sanitization and Payload discipline.
    Secrets must be redacted.
    Only approved fields enter payload audit telemetry.
    """
    logger = logging.getLogger("test_logger")
    
    token_req = request_id_context.set("trace-1234")
    token_usr = user_id_context.set("actor-5678")
    
    sensitive_jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
    sensitive_rsa = "-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA...\n-----END RSA PRIVATE KEY-----"
    sensitive_password = "password: 'superSecret!123'"
    
    # Attempt to log sensitive data and unapproved payload fields
    logger.info(
        f"User used JWT: {sensitive_jwt}, Key: {sensitive_rsa}, Pwd: {sensitive_password}",
        extra={
            "event": "test_sanitization",
            "business_owner_id": "tenant-abc",
            "resource_type": "user",
            "resource_id": "user-1",
            "payload": {
                "allowed_field": "safe",
                "secret_field": "should not appear",
                "nested_jwt": sensitive_jwt
            },
            "allowed_payload_keys": ["allowed_field", "nested_jwt"]
        }
    )
    
    request_id_context.reset(token_req)
    user_id_context.reset(token_usr)
    
    output = capture_logs.getvalue()
    log_record = json.loads(output.splitlines()[-1])
    
    # 4. Sanitization properties
    assert "eyJ" not in output
    assert "BEGIN RSA PRIVATE KEY" not in output
    assert "superSecret" not in output
    assert "[REDACTED_JWT]" in log_record["message"]
    assert "[REDACTED_RSA_KEY]" in log_record["message"]
    assert "[REDACTED]" in log_record["message"]
    assert log_record["payload"]["nested_jwt"] == "[REDACTED_JWT]"
    
    # 5. Payload discipline properties
    assert "allowed_field" in log_record["payload"]
    assert "secret_field" not in log_record["payload"]
    assert "should not appear" not in output

def test_full_lifecycle_reconstruction(db, setup_tenants, auth_mock, capture_logs):
    """
    Test 1, 2, 3: Correlation, Identity, Reconstruction across a lifecycle.
    Opportunity -> Quote -> Accept
    """
    tenant_id = setup_tenants["A"]
    client = TestClient(app, raise_server_exceptions=False)
    
    # 1. Create Opportunity
    resp_opp = client.post(
        "/api/v1/opportunities",
            json={
                "created_by_profile_id": tenant_id,
                "title": "Obs Test Opp",
                "province": "Gauteng",
                "town_or_city": "Johannesburg",
                "category_key": "PLUMBING",
                "service_needed": "Fix leak",
                "contact_name": "Obs Customer",
                "contact_phone": "+1234567890",
            }  )
    assert resp_opp.status_code == 200
    opp_id = resp_opp.json()["id"]
    
    # 2. Issue Quote
    resp_quote = client.post(
        "/api/v1/quotes",
        json={
            "business_owner_id": tenant_id,
            "customer_name": "Obs Customer",
            "customer_phone": "+1234567890",
            "description": "Test quote",
            "amount": "100.00",
            "currency": "USD",
            "opportunity_id": opp_id
        }
    )
    assert resp_quote.status_code == 200
    quote_id = resp_quote.json()["id"]
    
    # 3. Accept Quote
    resp_accept = client.post(f"/api/v1/quotes/{quote_id}/accept")
    assert resp_accept.status_code == 200
    
    output = capture_logs.getvalue()
    logs = [json.loads(line) for line in output.splitlines() if line.strip()]
    
    # Find quote accepted logs
    accept_logs = [log for log in logs if log.get("operation") in ["state_transition_applied", "continuity_event_emitted"] and log.get("resource_id") == quote_id]
    
    # 1. Correlation: all have trace_id
    assert all("trace_id" in log for log in accept_logs)
    
    # 2. Identity: all have actor_id and tenant_id
    assert all("actor_id" in log for log in accept_logs)
    assert all(log.get("tenant_id") == tenant_id for log in accept_logs)
    
    # 3. Reconstruction: state transition observed
    transition_logs = [log for log in accept_logs if log.get("operation") == "state_transition_applied"]
    assert len(transition_logs) > 0
    
    # We may have multiple transitions for this quote (e.g. draft -> issued, then issued -> accepted)
    accept_transition = [log for log in transition_logs if log["state_after"] == "accepted"][0]
    assert accept_transition["state_before"] == "issued"
    assert accept_transition["outcome"] == "applied"
