import redis
import json
import os
import uuid
from datetime import datetime

class DemandPubSub:
    def __init__(self):
        self.redis = redis.Redis(
            host=os.getenv("REDIS_HOST", "localhost"),
            port=6379,
            decode_responses=True
        )

    def publish(self, channel: str, event_type: str, entity_type: str, entity_id: str, geo_data: dict, payload: dict, source: str):
        # Enforce event envelope standard
        event = {
            "event_type": event_type,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "entity_type": entity_type,
            "entity_id": entity_id,
            "geo": geo_data,
            "payload": payload,
            "source": source,
            "dedup_key": f"{event_type}:{entity_id}:{datetime.utcnow().strftime('%Y%m%d%H%M')}"
        }
        self.redis.publish(channel, json.dumps(event))

    def subscribe(self, channel: str):
        pubsub = self.redis.pubsub()
        pubsub.subscribe(channel)
        return pubsub

demand_pubsub = DemandPubSub()
