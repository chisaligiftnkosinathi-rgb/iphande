from datetime import datetime, timezone

from fastapi import APIRouter


router = APIRouter(prefix="/api/v1/mobile", tags=["mobile-handshake"])


@router.get("/handshake")
def mobile_handshake():
    return {
        "status": "ok",
        "app": "iPhande API",
        "contract": "mobile-handshake-v1",
        "server_time": datetime.now(timezone.utc).isoformat(),
        "services": {
            "replay": "available",
            "continuity_events": "available",
        },
    }


@router.get("/heartbeat")
def mobile_heartbeat():
    return {
        "status": "alive",
        "app": "iPhande API",
        "server_time": datetime.now(timezone.utc).isoformat(),
    }
