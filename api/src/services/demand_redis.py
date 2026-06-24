import redis
from src.utils.redis_config import get_redis_client
import json
import os

class DemandRedisCache:
    def __init__(self):
        self.client = get_redis_client()
            decode_responses=True
        )
        self.ttl = 60  # seconds

    def get(self, geo_cell: str, archetype: str):
        key = f"demand:v1:{geo_cell}:{archetype}"
        value = self.client.get(key)
        if value:
            return json.loads(value)
        return None

    def set(self, geo_cell: str, archetype: str, value: dict):
        key = f"demand:v1:{geo_cell}:{archetype}"
        self.client.setex(
            key,
            self.ttl,
            json.dumps(value)
        )
