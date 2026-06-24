from src.services.demand_engine import DemandSignalBundle

def get_feedback_events(lat: float, lng: float) -> list:
    return []

def get_engagement_events(lat: float, lng: float) -> list:
    return []

def get_activation_events(lat: float, lng: float) -> list:
    return []

def get_trust_scores(lat: float, lng: float) -> list:
    return []

def get_geo_clusters(lat: float, lng: float) -> list:
    return []

from src.services.fraud.signal_validity_engine import fraud_engine

def build_signals_from_context(lat: float, lng: float):
    # This is a stub aggregator that fetches the latest reality data around a lat/lng.
    
    # We would normally hit the DB for real recent actions in this cell
    raw_signals = [
        {"type": "opportunity", "weight": 0.8, "age_hours": 2, "actor_id": "profile_1"},
        {"type": "engagement", "weight": 0.5, "age_hours": 1, "actor_id": "profile_2"},
        {"type": "trust", "weight": 0.9, "age_hours": 0.5, "actor_id": "profile_3"}
    ]
    
    # FRAUD FILTER: Ensure demand only learns from reality
    class DummyEvent:
        def __init__(self, d):
            self.__dict__.update(d)
            
    filtered = []
    for s in raw_signals:
        dummy = DummyEvent({"profile_id": s.get("actor_id"), "event_type": s["type"]})
        if fraud_engine.evaluate_event(dummy) > 0.6:
            filtered.append(s)

    return {
        "recent_opportunities": sum([1 for s in filtered if s["type"] == "opportunity"]),
        "recent_engagement_clicks": sum([1 for s in filtered if s["type"] == "engagement"]),
        "local_trust_density": 0.75,
        "velocity": "high"
    }
