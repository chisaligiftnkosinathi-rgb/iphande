from fastapi import APIRouter
from src.services.telemetry.drift_controller import drift_controller

router = APIRouter(prefix="/telemetry/drift", tags=["Telemetry Drift Controller"])

@router.get("/")
def get_current_drift():
    # In a fully wired system, we would query the active policy and current metrics
    # from the background worker state in Redis, instead of re-evaluating dynamically here.
    # For now we can fetch the active policy:
    
    import json
    import os
    import redis
from src.utils.redis_config import get_redis_client
    r = get_redis_client()
    
    policy_str = r.get("active_drift_policy")
    if policy_str:
        return json.loads(policy_str)
        
    return {
        "overall_drift": 0.0,
        "drift_breakdown": {
            "match": 0.0,
            "demand": 0.0,
            "trust": 0.0,
            "fraud": 0.0
        },
        "policy": {
            "action": "none",
            "effects": {}
        }
    }
