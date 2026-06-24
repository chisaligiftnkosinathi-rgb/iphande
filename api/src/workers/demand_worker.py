import json
import time
from src.services.demand_pubsub import demand_pubsub

def start_worker():
    print("Starting Demand Worker...")
    pubsub = demand_pubsub.subscribe("demand.events")
    
    # Simple deduplication cache
    processed_events = set()

    for message in pubsub.listen():
        if message["type"] == "message":
            event = json.loads(message["data"])
            dedup_key = event.get("dedup_key")
            
            if dedup_key in processed_events:
                continue # Idempotency check
                
            processed_events.add(dedup_key)
            
            print(f"[Demand Worker] Processing: {event['event_type']} from {event['source']}")
            
            # Logic: If threshold exceeded, trigger demand recompute
            # e.g., if event_type == "feedback_received", increment local counter 
            # and if counter > 10, run recompute for that geo_cell.

if __name__ == "__main__":
    start_worker()
