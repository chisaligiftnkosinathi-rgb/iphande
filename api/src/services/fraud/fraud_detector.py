from src.services.fraud.fraud_scoring import fraud_scorer
import os
import redis
from src.utils.redis_config import get_redis_client
import json
import logging

logger = logging.getLogger(__name__)

class FraudDetector:
    def __init__(self, redis_client=None):
        """Initialize fraud detector. Redis client is optional."""
        self.redis = redis_client
        self._redis_available = redis_client is not None

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

        # Only cache in Redis if available
        if self._redis_available and self.redis:
            try:
                cache_key = f"fraud:{profile_id}"
                state = {
                    "fraud_score": score,
                    "risk": risk,
                    "last_event": getattr(event, 'event_type', 'unknown'),
                    "svs_avg": 1.0 - (score / 100.0)
                }
                self.redis.setex(cache_key, 3600, json.dumps(state))
            except Exception as e:
                logger.warning(f"Failed to cache fraud detection result: {e}")

        return {
            "fraud_score": score,
            "risk_level": risk,
            "fraud_reasons": reasons
        }

    def get_risk(self, profile_id: str):
        """Get cached risk level, or 'low' if not cached or Redis unavailable."""
        if not self._redis_available or not self.redis:
            return "low"

        try:
            cache_key = f"fraud:{profile_id}"
            cached = self.redis.get(cache_key)
            if cached:
                state = json.loads(cached)
                return state.get("risk", "low")
        except Exception as e:
            logger.warning(f"Failed to retrieve fraud risk from cache: {e}")

        return "low"

    def is_suspicious(self, profile_id: str) -> bool:
        """Check if profile has high or critical fraud risk."""
        risk = self.get_risk(profile_id)
        return risk in ["high", "critical"]

# Lazy initialization: create fraud_detector only when imported, but don't crash if Redis fails
redis_client = get_redis_client()
fraud_detector = FraudDetector(redis_client=redis_client)
