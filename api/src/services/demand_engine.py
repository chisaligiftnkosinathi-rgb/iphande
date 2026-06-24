from dataclasses import dataclass
from typing import Dict, List
from datetime import datetime

@dataclass
class DemandCell:
    archetype: str
    geo_cell: str
    time_window: str  # "0-24h", "24-72h", "3-7d"

    demand_score: float
    trend: str  # rising | stable | declining

    components: Dict[str, float]

class DemandSignalBundle:
    def __init__(
        self,
        feedback_events: list,
        engagement_events: list,
        activation_events: list,
        trust_scores: list,
        geo_clusters: list,
    ):
        self.feedback_events = feedback_events
        self.engagement_events = engagement_events
        self.activation_events = activation_events
        self.trust_scores = trust_scores
        self.geo_clusters = geo_clusters

class DemandEngine:
    def __init__(self):
        self.weights = {
            "opportunity_velocity": 0.35,
            "engagement_velocity": 0.25,
            "feedback_intent": 0.15,
            "trust_supply_gap": 0.15,
            "geo_cluster_growth": 0.10,
        }

    def compute_opportunity_velocity(self, events, archetype, geo_cell):
        relevant = [
            e for e in events
            if e.get("archetype") == archetype and e.get("geo_cell") == geo_cell
        ]
        return min(len(relevant) / 10.0, 1.0)

    def compute_engagement_velocity(self, events, archetype, geo_cell):
        engaged = [
            e for e in events
            if e.get("archetype") == archetype
            and e.get("geo_cell") == geo_cell
            and e.get("type") in ["VIEWED", "CLICKED", "NAVIGATED"]
        ]
        return min(len(engaged) / 20.0, 1.0)

    def compute_feedback_intent(self, events, archetype, geo_cell):
        score = 0.0
        for e in events:
            if e.get("archetype") != archetype:
                continue

            if e.get("type") == "CONVERTED":
                score += 1.0
            elif e.get("type") == "CLICKED":
                score += 0.5
            elif e.get("type") == "DISMISSED":
                score -= 0.3

        return max(0.0, min(score / 10.0, 1.0))

    def compute_trust_supply_gap(self, trust_scores, archetype, geo_cell):
        providers = [
            t for t in trust_scores
            if t.get("archetype") == archetype and t.get("geo_cell") == geo_cell
        ]
        if not providers:
            return 1.0

        avg_trust = sum(p.get("overall_trust", 0.5) for p in providers) / len(providers)
        supply_penalty = max(0, 1 - len(providers) / 5)

        return (1 - avg_trust) * 0.6 + supply_penalty * 0.4

    def compute_geo_cluster_growth(self, geo_clusters, geo_cell):
        cluster = next((c for c in geo_clusters if c.get("geo_cell") == geo_cell), None)
        if not cluster:
            return 0.0
        return min(cluster.get("growth_rate", 0.0), 1.0)

    def compute_demand_score(self, signals: DemandSignalBundle, archetype: str, geo_cell: str):
        ov = self.compute_opportunity_velocity(signals.activation_events, archetype, geo_cell)
        ev = self.compute_engagement_velocity(signals.engagement_events, archetype, geo_cell)
        fi = self.compute_feedback_intent(signals.feedback_events, archetype, geo_cell)
        ts = self.compute_trust_supply_gap(signals.trust_scores, archetype, geo_cell)
        gc = self.compute_geo_cluster_growth(signals.geo_clusters, geo_cell)

        score = (
            ov * self.weights["opportunity_velocity"] +
            ev * self.weights["engagement_velocity"] +
            fi * self.weights["feedback_intent"] +
            ts * self.weights["trust_supply_gap"] +
            gc * self.weights["geo_cluster_growth"]
        )

        return {
            "demand_score": round(score, 4),
            "components": {
                "opportunity_velocity": ov,
                "engagement_velocity": ev,
                "feedback_intent": fi,
                "trust_supply_gap": ts,
                "geo_cluster_growth": gc,
            }
        }

    def detect_trend(self, history: List[float]):
        if len(history) < 3:
            return "stable"
        if history[-1] > history[-2] > history[-3]:
            return "rising"
        if history[-1] < history[-2] < history[-3]:
            return "declining"
        return "stable"

    def build_demand_matrix(self, signals: DemandSignalBundle, archetypes: List[str], geo_cells: List[str]):
        results = []
        for archetype in archetypes:
            for geo_cell in geo_cells:
                score_data = self.compute_demand_score(signals, archetype, geo_cell)
                cell = DemandCell(
                    archetype=archetype,
                    geo_cell=geo_cell,
                    time_window="0-72h",
                    demand_score=score_data["demand_score"],
                    trend="stable",
                    components=score_data["components"],
                )
                results.append(cell)
        return results
