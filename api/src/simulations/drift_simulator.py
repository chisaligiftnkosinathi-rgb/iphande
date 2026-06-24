from src.services.demand_pubsub import demand_pubsub

class DriftSimulator:
    def run(self, scenario):
        events = scenario.generate()
        
        for e in events:
            # Inject synthetic event directly into the economic nervous system
            demand_pubsub.publish(
                channel=e["channel"],
                event_type=e["event_type"],
                entity_type="simulation",
                entity_id="synthetic",
                geo_data=e.get("geo_data", {}),
                payload=e.get("payload", {}),
                source=e.get("source", "simulation_harness")
            )
            
        return {
            "status": "simulation_sent",
            "scenario": scenario.__class__.__name__
        }

drift_simulator = DriftSimulator()
