import json
import time
from src.services.demand_pubsub import demand_pubsub

def start_worker():
    print("Starting Match Worker...")
    pubsub = demand_pubsub.subscribe("match.events")
    
    processed_events = set()

    for message in pubsub.listen():
        if message["type"] == "message":
            event = json.loads(message["data"])
            dedup_key = event.get("dedup_key")
            
            if dedup_key in processed_events:
                continue
                
            processed_events.add(dedup_key)
            
            print(f"[Match Worker] Processing: {event['event_type']} for opportunity {event['entity_id']}")
            
            # Logic: Refresh top-N matches for affected entities, warm ActionStream cache, etc.

if __name__ == "__main__":
    start_worker()
