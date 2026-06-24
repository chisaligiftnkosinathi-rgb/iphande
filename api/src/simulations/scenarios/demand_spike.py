class DemandSpikeScenario:
    def generate(self):
        return [
            {
                "channel": "demand.events",
                "event_type": "opportunity_created",
                "geo_data": {"lat": -25.74, "lng": 28.18, "cell": "cell_-25.74_28.18"},
                "magnitude": 10,
                "burst": True,
                "payload": {"demand_intensity": "extreme"},
                "source": "simulation:demand_spike"
            }
        ]
