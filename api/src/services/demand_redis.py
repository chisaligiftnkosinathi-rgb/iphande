import redis
import json
import os

class DemandRedisCache:
    def __init__(self):
        self.client = redis.Redis(
            host=os.getenv("REDIS_HOST", "localhost"),
            port=6379,
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
