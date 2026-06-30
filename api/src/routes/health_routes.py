from fastapi import APIRouter
from sqlalchemy import text
from sqlalchemy.orm import Session
import logging
import time
from datetime import datetime, timezone
from typing import Any

from src.config import settings
from src.database import engine, SessionLocal

router = APIRouter()
logger = logging.getLogger(__name__)

# Captured once at module import — used to compute uptime
_APP_STARTED_AT: datetime = datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# Liveness
# ---------------------------------------------------------------------------

@router.get("/health")
def health_check():
    """
    Liveness probe. Returns 200 as long as the process is running.
    Use this for Railway / Kubernetes liveness checks.
    """
    return {
        "status": "alive",
        "app": settings.APP_NAME,
        "version": settings.API_VERSION,
        "environment": settings.ENVIRONMENT,
    }


@router.get("/db-health")
def db_health_check():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except Exception:
        logger.error("Database health check failed", exc_info=True)
        return {"status": "degraded", "database": "unreachable"}
    return {"status": "ok", "database": "reachable"}


@router.get("/version")
def version_check():
    return {
        "name": settings.APP_NAME,
        "version": settings.API_VERSION,
        "environment": settings.ENVIRONMENT,
    }


@router.get("/api/v1/ready")
def readiness_check():
    """
    LAYER 3: READINESS GATE

    Tells you when the financial system is safe to accept money.

    Returns:
      - ready: true = all safety systems initialized, ok to process payments
      - ready: false = app is booting, defer financial operations
      - status: "ok" or "starting"

    Use this to:
      1. Block payment operations until ready=true
      2. Show "system starting..." UI during boot
      3. Prevent race conditions during cold starts

    Mobile should check this before sending payment requests.
    """
    from src.main import _app_state

    ready = _app_state.get("ready", False)
    return {
        "ready": ready,
        "status": "ok" if ready else "starting",
        "immutability": "active" if ready else "initializing",
    }


# ---------------------------------------------------------------------------
# Probe helpers — all use SELECT 1, never COUNT(*) or joins
# ---------------------------------------------------------------------------

def _probe(db: Session, table: str) -> dict[str, Any]:
    """
    Lightweight existence probe. Issues a single `SELECT 1 FROM <table> LIMIT 1`.
    Returns a status object with latency. Never raises.
    """
    t0 = time.perf_counter()
    try:
        db.execute(text(f"SELECT 1 FROM {table} LIMIT 1"))
        latency = round((time.perf_counter() - t0) * 1000, 2)
        return {"status": "ok", "latency_ms": latency}
    except Exception as exc:
        latency = round((time.perf_counter() - t0) * 1000, 2)
        return {"status": "error", "latency_ms": latency, "message": type(exc).__name__}


def _probe_optional(db: Session, table: str) -> dict[str, Any]:
    """
    Same as _probe but returns not_configured instead of error when the
    table doesn't exist. Used for features that may not be migrated yet.
    """
    t0 = time.perf_counter()
    try:
        db.execute(text(f"SELECT 1 FROM {table} LIMIT 1"))
        latency = round((time.perf_counter() - t0) * 1000, 2)
        return {"status": "ok", "latency_ms": latency}
    except Exception:
        latency = round((time.perf_counter() - t0) * 1000, 2)
        return {"status": "not_configured", "latency_ms": latency}


def _probe_cache() -> dict[str, Any]:
    """
    Probe Redis with a PING. Returns not_configured if REDIS_URL is unset.
    Hard timeout of 1 second to keep the health check fast.
    """
    if not settings.REDIS_URL:
        return {"status": "not_configured"}
    t0 = time.perf_counter()
    try:
        import redis  # type: ignore
        client = redis.from_url(settings.REDIS_URL, socket_connect_timeout=1)
        client.ping()
        latency = round((time.perf_counter() - t0) * 1000, 2)
        return {"status": "ok", "latency_ms": latency}
    except Exception as exc:
        latency = round((time.perf_counter() - t0) * 1000, 2)
        return {"status": "error", "latency_ms": latency, "message": type(exc).__name__}


def _overall(probes: dict[str, dict]) -> str:
    """Derive overall status: ok if all probes are ok or not_configured."""
    statuses = {p.get("status") for p in probes.values()}
    if "error" in statuses:
        return "degraded"
    return "ok"


# ---------------------------------------------------------------------------
# Readiness — dashboard dependency check
# ---------------------------------------------------------------------------

import uuid

_DASHBOARD_CACHE_TTL = 2.0
_DASHBOARD_CACHE = {
    "timestamp": 0.0,
    "response": None
}

@router.get("/api/v1/health/dashboard")
def dashboard_readiness_check():
    """
    Readiness probe for the dashboard aggregation layer.

    Tells you immediately which service is failing when a steward reports
    "my dashboard is blank", without exposing any user data.

    Endpoint responsibilities:
      /health                    — liveness (process running)
      /api/v1/health/dashboard   — readiness (dependencies available)   ← this
      /api/v1/dashboard          — user-facing data (requires auth)

    All probes use SELECT 1 / PING — no table scans, no joins, no reconciliation.
    Target latency: < 100ms under normal conditions.
    """
    now_ts = time.perf_counter()
    if now_ts - _DASHBOARD_CACHE["timestamp"] < _DASHBOARD_CACHE_TTL and _DASHBOARD_CACHE["response"] is not None:
        return _DASHBOARD_CACHE["response"]

    wall_start = time.perf_counter()
    db: Session = SessionLocal()

    try:
        services = {
            "database":      _probe(db, "users"),
            "merchant":      _probe(db, "merchant_accounts"),
            "trust":         _probe(db, "trust_scores"),
            "wallet":        _probe(db, "earning_ledgers"),
            "opportunities": _probe(db, "opportunities"),
            "notifications": _probe_optional(db, "notifications"),
            "cache":         _probe_cache(),
        }

        # Financial integrity — lightweight existence probes for all three ledgers
        # and platform config. These tell you whether the financial layer is
        # reachable, not whether the numbers balance (that's reconciliation work).
        financial_probes = {
            "fee_ledger":      _probe(db, "fee_ledgers"),
            "earning_ledger":  _probe(db, "earning_ledgers"),
            "treasury_ledger": _probe(db, "treasury_ledgers"),
            "platform_config": _probe(db, "platform_configs"),
        }
    finally:
        db.close()

    financial_overall = _overall(financial_probes)
    overall_status = _overall(services)
    if financial_overall == "degraded":
        overall_status = "degraded"

    now = datetime.now(timezone.utc)
    uptime_seconds = round((now - _APP_STARTED_AT).total_seconds())
    wall_ms = round((time.perf_counter() - wall_start) * 1000, 1)

    trace_id = f"health-{now.strftime('%Y%m%d')}-{uuid.uuid4().hex[:6]}"

    response = {
        "status":         overall_status,
        "healthy":        overall_status == "ok",
        "degraded":       overall_status == "degraded",
        "trace_id":       trace_id,
        "version":        settings.API_VERSION,
        "environment":    settings.ENVIRONMENT,
        "started_at":     _APP_STARTED_AT.isoformat(),
        "uptime_seconds": uptime_seconds,
        "latency_ms":     wall_ms,
        "services":       services,
        "financial": {
            "status": financial_overall,
            **financial_probes,
        },
    }

    _DASHBOARD_CACHE["timestamp"] = now_ts
    _DASHBOARD_CACHE["response"] = response

    return response


# ---------------------------------------------------------------------------
# PAYMENT SAFETY GUARD
# ---------------------------------------------------------------------------

def require_ready():
    """
    PAYMENT SAFETY CHECK

    MUST be called at the start of any payment/financial operation endpoint.

    Raises HTTPException(503) if financial system is not ready.

    Usage in payment routes:
        from src.routes.health_routes import require_ready

        @router.post("/api/v1/payments")
        async def create_payment(...):
            require_ready()  # Check before any payment logic
            ...
    """
    from fastapi import HTTPException
    from src.main import _app_state

    if not _app_state.get("ready", False):
        raise HTTPException(
            status_code=503,
            detail="Financial system not ready. Immutability guards still initializing. Retry in a few seconds."
        )
