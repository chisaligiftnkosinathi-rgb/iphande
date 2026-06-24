from src.services.telemetry.drift_detector import drift_detector
from src.services.telemetry.signal_baseline_store import signal_baseline_store
from src.services.telemetry.damping_policy_engine import damping_policy_engine
import json
import os
import redis

class DriftController:
    def __init__(self):
        self.redis = redis.Redis(host=os.getenv("REDIS_HOST", "localhost"), port=6379, decode_responses=True)

    def evaluate(self, telemetry_snapshot: dict) -> dict:
        
        drift_results = {}
        for signal_type, current_val in telemetry_snapshot.items():
            baseline = signal_baseline_store.get_baseline(signal_type)
            history = signal_baseline_store.get_history(signal_type)
            
            # Record current for future volatility
            signal_baseline_store.record_snapshot(signal_type, current_val)
            
            drift = drift_detector.compute_drift(current_val, baseline, history)
            drift_results[signal_type] = round(drift, 4)

        # Weighted sum: assume equal weight for now
        overall_drift = sum(drift_results.values()) / len(drift_results) if drift_results else 0.0
        overall_drift = round(overall_drift, 4)

        policy = damping_policy_engine.apply_damping("system", overall_drift)

        result = {
            "drift_breakdown": drift_results,
            "overall_drift": overall_drift,
            "policy": policy
        }

        # Cache active policy for fast downstream reads
        self.redis.setex("active_drift_policy", 60, json.dumps(result))

        return result
    
    def get_active_policy(self):
        policy_str = self.redis.get("active_drift_policy")
        if policy_str:
            try:
                return json.loads(policy_str).get("policy", {"action": "none", "effects": {}})
            except Exception:
                pass
        return {"action": "none", "effects": {}}

drift_controller = DriftController()
