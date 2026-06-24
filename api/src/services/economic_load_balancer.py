import os
import redis
from src.utils.redis_config import get_redis_client
import json
from src.services.availability_engine import availability_engine
# from src.services.trust_engine import get_trust_score

class EconomicLoadBalancer:
    def __init__(self):
        self.redis = get_redis_client()
            decode_responses=True
        )

    def compute(self, profile_id: str) -> dict:
        # Check cache first for high speed
        cache_key = f"load:{profile_id}"
        cached = self.redis.get(cache_key)
        if cached:
            try:
                return json.loads(cached)
            except Exception:
                pass

        # 1. Fetch Signals
        # In a real implementation, active_assignments, recent_completions, pending_engagements would be DB aggregations
        active_assignments = 0 # Stub
        recent_completions_24h = 0 # Stub
        pending_engagements = 0 # Stub
        
        availability = availability_engine.compute(profile_id)
        avail_score = availability.get("score", 0.0)
        
        trust_score = 0.8 # Stub for v1

        # 2. Compute Load Score
        load_score = (
            (active_assignments * 0.5) +
            (recent_completions_24h * 0.2) +
            (pending_engagements * 0.2) -
            (avail_score * 0.6)
        )
        
        # Ensure load score doesn't drop below 0
        load_score = max(0.0, load_score)

        # 3. Capacity Ceiling
        base_capacity = 10
        capacity_limit = max(1, int(trust_score * base_capacity))

        # 4. Load Status Bands
        load_ratio = load_score / capacity_limit if capacity_limit > 0 else 1.0

        if load_ratio < 0.5:
            status = "underloaded"
        elif load_ratio < 0.85:
            status = "healthy"
        elif load_ratio < 1.0:
            status = "stressed"
        else:
            status = "overloaded"

        result = {
            "profile_id": profile_id,
            "load_score": round(load_score, 4),
            "capacity_limit": capacity_limit,
            "load_ratio": round(load_ratio, 4),
            "status": status
        }

        # Cache with short TTL
        self.redis.setex(cache_key, 60, json.dumps(result))

        return result

    def record_completion(self, profile_id: str):
        # Stub for feedback engine hook: reduces pressure
        pass
        
    def record_abandonment(self, profile_id: str):
        # Stub for feedback engine hook: increases penalty
        pass

economic_load_balancer = EconomicLoadBalancer()
