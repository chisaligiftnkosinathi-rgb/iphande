import redis
import json
import os
import uuid
from datetime import datetime

from src.utils.redis_config import get_redis_client

class DemandPubSub:
    def __init__(self):
        self.redis = get_redis_client()

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
