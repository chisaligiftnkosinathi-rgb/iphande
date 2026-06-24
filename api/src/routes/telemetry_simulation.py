from fastapi import APIRouter
from src.simulations.drift_simulator import drift_simulator
import json
import os
import redis

router = APIRouter(prefix="/simulations", tags=["Drift Simulations"])

# Expose control to the dashboard or internal tooling
r = redis.Redis(host=os.getenv("REDIS_HOST", "localhost"), port=6379, decode_responses=True)

@router.post("/start")
def start_simulation(config: dict):
    # e.g., {"scenario": "demand_spike", "intensity": "high"}
    r.set("simulation:active", "true")
    r.set("simulation:current_scenario", config.get("scenario", "demand_spike"))
    return {"status": "started", "scenario": config.get("scenario")}

@router.post("/stop")
def stop_simulation():
    r.set("simulation:active", "false")
    return {"status": "stopped"}

@router.get("/status")
def get_status():
    active = r.get("simulation:active") == "true"
    current_scenario = r.get("simulation:current_scenario")
    
    # Read drift controller's reaction
    policy_str = r.get("active_drift_policy")
    drift_response = json.loads(policy_str) if policy_str else {}
    
    return {
        "active": active,
        "current_scenario": current_scenario,
        "drift_response": drift_response
    }
