import time

class DemandCache:
    def __init__(self, ttl_seconds: int = 60):
        self.memory_cache = {}
        self.ttl_seconds = ttl_seconds

    def is_expired(self, cached_item: dict) -> bool:
        return (time.time() - cached_item["timestamp"]) > self.ttl_seconds

    def get(self, geo_cell: str, archetype: str):
        key = f"{geo_cell}:{archetype}"

        if key in self.memory_cache:
            cached = self.memory_cache[key]
            if not self.is_expired(cached):
                return cached["value"]
            else:
                del self.memory_cache[key]

        return None

    def set(self, geo_cell: str, archetype: str, value: dict):
        key = f"{geo_cell}:{archetype}"
        self.memory_cache[key] = {
            "value": value,
            "timestamp": time.time()
        }
