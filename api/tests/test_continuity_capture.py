
import pytest
from fastapi.testclient import TestClient
from src.main import app
import uuid

@pytest.fixture(scope="module")
def test_client():
    with TestClient(app) as client:
        yield client

steward_id = "steward-123"

import pytest
from fastapi.testclient import TestClient
from src.main import app
import uuid


import pytest

@pytest.fixture(scope="module")
def test_client():
    with TestClient(app) as client:
        yield client

steward_id = "steward-123"


def test_create_quick_text_capture(test_client):
    payload = {
        "steward_id": steward_id,
        "source_type": "quick_text",
        "raw_text": "Test quick note"
    }
    resp = test_client.post("/api/v1/continuity-captures", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["steward_id"] == steward_id
    assert data["source_type"] == "quick_text"
    assert data["raw_text"] == "Test quick note"
    assert data["status"] == "captured"
    assert "id" in data
    assert "created_at" in data
    assert "updated_at" in data


def test_create_payment_signal_capture_with_context_hint(test_client):
    payload = {
        "steward_id": steward_id,
        "source_type": "payment_signal",
        "context_hint": "EFT screenshot sent via WhatsApp"
    }
    resp = test_client.post("/api/v1/continuity-captures", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["source_type"] == "payment_signal"
    assert data["context_hint"] == "EFT screenshot sent via WhatsApp"


def test_reject_empty_capture_payload(test_client):
    payload = {
        "steward_id": steward_id,
        "source_type": "other"
    }
    resp = test_client.post("/api/v1/continuity-captures", json=payload)
    assert resp.status_code == 422


def test_list_captures_by_steward(test_client):
    # Create two captures
    test_client.post("/api/v1/continuity-captures", json={
        "steward_id": steward_id,
        "source_type": "quick_text",
        "raw_text": "First"
    })
    test_client.post("/api/v1/continuity-captures", json={
        "steward_id": steward_id,
        "source_type": "quick_text",
        "raw_text": "Second"
    })
    resp = test_client.get(f"/api/v1/continuity-captures?steward_id={steward_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) >= 2
    for item in data:
        assert item["steward_id"] == steward_id


def test_read_capture_by_id(test_client):
    # Create a capture
    resp = test_client.post("/api/v1/continuity-captures", json={
        "steward_id": steward_id,
        "source_type": "quick_text",
        "raw_text": "Read by id"
    })
    assert resp.status_code == 200
    capture_id = resp.json()["id"]
    # Read it
    resp2 = test_client.get(f"/api/v1/continuity-captures/{capture_id}")
    assert resp2.status_code == 200
    data = resp2.json()
    assert data["id"] == capture_id
    assert data["raw_text"] == "Read by id"


def test_capture_defaults_to_captured_status(test_client):
    payload = {
        "steward_id": steward_id,
        "source_type": "quick_text",
        "raw_text": "Default status"
    }
    resp = test_client.post("/api/v1/continuity-captures", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "captured"
