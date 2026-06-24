import os
import redis
from src.utils.redis_config import get_redis_client
import json

class SignalBaselineStore:
    def __init__(self):
        self.redis = get_redis_client()
            decode_responses=True
        )

    def get_baseline(self, signal_type: str) -> float:
        # Default healthy baselines
        defaults = {
            "match": 0.70,   # 70% success / auto-assigned
            "demand": 0.50,  # Medium demand density
            "trust": 0.85,   # High average trust in system
            "fraud": 0.15    # Small baseline of noise
        }
        val = self.redis.get(f"baseline:{signal_type}")
        return float(val) if val else defaults.get(signal_type, 0.5)

    def get_history(self, signal_type: str) -> list:
        data = self.redis.lrange(f"history:{signal_type}", 0, -1)
        return [float(x) for x in data] if data else []

    def record_snapshot(self, signal_type: str, value: float):
        key = f"history:{signal_type}"
        self.redis.lpush(key, value)
        self.redis.ltrim(key, 0, 99) # Keep last 100 snapshots

signal_baseline_store = SignalBaselineStore()
