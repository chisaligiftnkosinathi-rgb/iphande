class FraudBurstScenario:
    def generate(self):
        # We simulate rapid engagement with terrible SVS to see if Fraud layer blocks it.
        events = []
        for i in range(5):
            events.append({
                "channel": "feedback.events",
                "event_type": "feedback_received",
                "geo_data": {"lat": -25.7, "lng": 28.2, "cell": "cell_fake"},
                "payload": {"svs_override": 0.1, "rate": "high_frequency"},
                "source": "simulation:fraud_burst"
            })
        return events
