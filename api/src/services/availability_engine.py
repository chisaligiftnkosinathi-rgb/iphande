import time
from src.services.presence_manager import presence_manager
# from src.services.trust_engine import get_or_create_trust
# from src.services.feedback_engine import get_feedback_metrics
# from src.services.demand_engine import get_workload

class AvailabilityEngine:

    def _presence_score(self, presence: dict):
        if not presence or presence.get("status") != "online":
            return 0.1
        
        # Decay score based on last seen (e.g., 5 mins max)
        age = time.time() - presence.get("last_seen", 0)
        if age < 60:
            return 1.0
        elif age < 300:
            return 0.7
        else:
            return 0.3

    def _engagement_score(self, profile_id: str):
        # Stub: normally fetched from feedback metrics
        # For v1, pull simple engagement proxy from presence if available
        presence = presence_manager.get(profile_id)
        if presence and "activity" in presence:
            return presence["activity"].get("engagement_score", 0.5)
        return 0.5

    def _trust_score(self, profile_id: str):
        # Stub: normally fetch from db via trust_engine
        return 0.8  # Assume high trust for demo v1

    def _workload_score(self, profile_id: str):
        # Stub: normally fetch active jobs or local demand workload
        return 0.8  # Assume not overloaded

    def compute(self, profile_id: str):
        presence = presence_manager.get(profile_id)
        
        p_score = self._presence_score(presence)
        e_score = self._engagement_score(profile_id)
        t_score = self._trust_score(profile_id)
        w_score = self._workload_score(profile_id)

        score = (
            p_score * 0.30 +
            e_score * 0.25 +
            t_score * 0.25 +
            w_score * 0.20
        )

        status = self._classify(score)

        return {
            "profile_id": profile_id,
            "availability_status": status,
            "score": round(score, 4),
            "reasons": [
                "presence_active" if p_score > 0.5 else "presence_idle",
                "engagement_high" if e_score > 0.6 else "engagement_moderate",
                "trust_solid" if t_score > 0.7 else "trust_building",
                "workload_available" if w_score > 0.5 else "workload_heavy"
            ],
            "constraints": {
                "time_window": "now" if status == "available" else "soon" if status == "uncertain" else "offline",
                "geo_radius_ok": True,
                "device_active": p_score > 0.8
            },
            "timestamp": time.time()
        }

    def _classify(self, score: float):
        if score > 0.75:
            return "available"
        elif score > 0.5:
            return "uncertain"
        elif score > 0.25:
            return "busy"
        else:
            return "unavailable"

availability_engine = AvailabilityEngine()
