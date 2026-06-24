class GeoClusterScenario:
    def generate(self):
        return [
            {
                "channel": "geo.events",
                "event_type": "geo_cluster_shifted",
                "geo_data": {"lat": -25.7, "lng": 28.2, "cell": "cell_10"},
                "payload": {
                    "geo_cells": ["cell_10", "cell_11", "cell_12"],
                    "profile_density": 0.2,
                    "opportunity_density": 9.0
                },
                "source": "simulation:geo_cluster"
            }
        ]
