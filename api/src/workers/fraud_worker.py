import json
import time
from src.services.demand_pubsub import demand_pubsub
from src.services.fraud.signal_validity_engine import fraud_engine

class DictEvent:
    def __init__(self, d):
        self.__dict__.update(d)
        # map payload to the object for duck-typing
        if 'payload' in d:
            self.__dict__.update(d['payload'])

def start_worker():
    print("Starting Fraud Worker...")
    pubsub = demand_pubsub.subscribe("feedback.events")
    # Also subscribe to geo and match
    pubsub.subscribe("geo.events")
    pubsub.subscribe("match.events")
    pubsub.subscribe("demand.events")
    
    processed_events = set()

    for message in pubsub.listen():
        if message["type"] == "message":
            event_data = json.loads(message["data"])
            dedup_key = event_data.get("dedup_key")
            
            if dedup_key and dedup_key in processed_events:
                continue
                
            if dedup_key:
                processed_events.add(dedup_key)
            
            print(f"[Fraud Worker] Validating: {event_data['event_type']} for {event_data['entity_id']}")
            
            # Reconstruct dummy event to evaluate
            event = DictEvent({
                "profile_id": event_data.get("entity_id"),
                "event_type": event_data.get("event_type"),
                "payload": event_data.get("payload", {})
            })

            # Run through SVS
            svs = fraud_engine.evaluate_event(event)
            print(f"[Fraud Worker] SVS computed: {svs} for {event_data['entity_id']}")

            # In a full system, publish fraud.updated if status changed significantly

if __name__ == "__main__":
    start_worker()
