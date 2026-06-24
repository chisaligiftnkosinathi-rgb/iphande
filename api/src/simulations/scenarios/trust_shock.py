class TrustShockScenario:
    def generate(self):
        return [
            {
                "channel": "demand.events", # Broad system impact
                "event_type": "system_trust_shock",
                "geo_data": {"lat": 0, "lng": 0, "cell": "global"},
                "payload": {
                    "trust_drop": 0.4,
                    "completion_rate": -0.6
                },
                "source": "simulation:trust_shock"
            }
        ]
