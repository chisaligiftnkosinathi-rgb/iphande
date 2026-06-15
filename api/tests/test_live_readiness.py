from fastapi.testclient import TestClient

from src.main import app

client = TestClient(app)


def test_health_endpoint_returns_readiness_metadata():
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "alive"
    assert body["app"] == "iPhande API"
    assert body["version"] == "0.1.0"
    assert body["environment"]


def test_db_health_endpoint_reports_database_status():
    response = client.get("/db-health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] in {"ok", "degraded"}
    assert "database" in body


def test_cors_preflight_allows_mobile_clients():
    response = client.options(
        "/health",
        headers={
            "Origin": "http://localhost:19006",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:19006"


def test_mobile_handshake_reports_replay_contract():
    response = client.get("/api/v1/mobile/handshake")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["app"] == "iPhande API"
    assert body["contract"] == "mobile-handshake-v1"
    assert body["services"]["replay"] == "available"
    assert body["services"]["continuity_events"] == "available"
    assert body["server_time"]


def test_mobile_heartbeat_reports_alive():
    response = client.get("/api/v1/mobile/heartbeat")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "alive"
    assert body["app"] == "iPhande API"
    assert body["server_time"]
