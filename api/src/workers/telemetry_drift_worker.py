import time
import requests
import os
from src.services.telemetry.drift_controller import drift_controller

def gather_snapshot():
    # Helper to gather metrics from endpoints or internal DB layers
    # In production, we'd query internal DB methods directly for speed
    return {
        "match": 0.80, # stub
        "demand": 0.60, # stub
        "trust": 0.90, # stub
        "fraud": 0.10 # stub
    }

def start_worker():
    print("Starting Telemetry Drift Worker...")
    
    from src.services.demand_pubsub import demand_pubsub
    
    while True:
        try:
            snapshot = gather_snapshot()
            result = drift_controller.evaluate(snapshot)
            
            print(f"[Drift Worker] Overall Drift: {result['overall_drift']} | Action: {result['policy']['action']}")
            
            # Emit event to the nervous system so other components know immediately if we go into hard_stabilize
            demand_pubsub.publish(
                channel="telemetry.events",
                event_type="drift_updated",
                entity_type="system",
                entity_id="global",
                geo_data={"lat": 0.0, "lng": 0.0, "cell": "global"},
                payload=result,
                source="drift_worker"
            )
            
            time.sleep(20) # Run every 20 seconds
            
        except Exception as e:
            print(f"[Drift Worker] Error: {e}")
            time.sleep(10)

if __name__ == "__main__":
    start_worker()
