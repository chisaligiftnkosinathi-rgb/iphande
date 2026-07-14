from datetime import datetime, timezone

from fastapi import APIRouter


router = APIRouter(prefix="/api/v1/mobile", tags=["mobile-handshake"])


@router.get("/handshake")
def mobile_handshake():
    from src.config import settings
    return {
        "status": "ok",
        "app": "iPhande API",
        "contract": "mobile-handshake-v1",
        "api_version": settings.API_VERSION,
        "deployment": settings.DEPLOYMENT_MODE,
        "maintenance": False,
        "minimum_mobile_version": "1.0.0",
        "recommended_mobile_version": "1.0.0",
        "server_time": datetime.now(timezone.utc).isoformat(),
        "services": {
            "replay": "available",
            "continuity_events": "available",
        },
        "features": {
            "payments": True,
            "inventory": True,
            "telemetry": True
        }
    }


@router.get("/heartbeat")
def mobile_heartbeat():
    return {
        "status": "alive",
        "app": "iPhande API",
        "server_time": datetime.now(timezone.utc).isoformat(),
    }
