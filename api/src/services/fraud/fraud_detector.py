from src.services.fraud.fraud_scoring import fraud_scorer
import os
import redis
from src.utils.redis_config import get_redis_client
import json

class FraudDetector:
    def __init__(self):
        self.redis = get_redis_client()
            decode_responses=True
        )

    def classify_and_record(self, profile_id: str, event):
        score = fraud_scorer.compute_score(event)
        
        if score > 80:
            risk = "critical"
        elif score > 60:
            risk = "high"
        elif score > 30:
            risk = "medium"
        else:
            risk = "low"

        reasons = []
        if risk != "low":
            reasons.append("suspicious_behavior_detected")

        # Record in Redis
        cache_key = f"fraud:{profile_id}"
        
        # Simple moving average for SVS if we had historical
        state = {
            "fraud_score": score,
            "risk": risk,
            "last_event": getattr(event, 'event_type', 'unknown'),
            "svs_avg": 1.0 - (score / 100.0)
        }
        
        self.redis.setex(cache_key, 3600, json.dumps(state))

        return {
            "fraud_score": score,
            "risk_level": risk,
            "fraud_reasons": reasons
        }

    def get_risk(self, profile_id: str):
        cache_key = f"fraud:{profile_id}"
        cached = self.redis.get(cache_key)
        if cached:
            try:
                state = json.loads(cached)
                return state.get("risk", "low")
            except Exception:
                pass
        return "low"

    def is_suspicious(self, profile_id: str) -> bool:
        risk = self.get_risk(profile_id)
        return risk in ["high", "critical"]

fraud_detector = FraudDetector()
