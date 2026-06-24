from src.services.availability_engine import availability_engine
from src.services.presence_manager import presence_manager
# from src.services.feedback_engine import get_channel_weights

class SmartRouter:

    def route(self, action_packet: dict, profile_id: str):
        
        # 1. Fetch State
        availability = availability_engine.compute(profile_id)
        presence = presence_manager.get(profile_id)
        
        avail_score = availability.get("score", 0.0)
        is_online = 1.0 if (presence and presence.get("status") == "online") else 0.0
        
        urgency = action_packet.get("priority", 0.5)
        
        # 4. Engagement History (Stubbed for v1: would fetch real user preferences from DB)
        engagement_ws_bias = 0.5
        mobile_activity = 0.5
        engagement_whatsapp = 0.5
        
        # 🧮 Routing Score Model
        ws_score = (
            avail_score * 0.35 +
            is_online * 0.30 +
            urgency * 0.25 +
            engagement_ws_bias * 0.10
        )

        push_score = (
            avail_score * 0.30 +
            urgency * 0.30 +
            mobile_activity * 0.25 +
            0.15 # fallback weight
        )

        whatsapp_score = (
            engagement_whatsapp * 0.40 +
            avail_score * 0.25 +
            urgency * 0.20 +
            0.15 # fallback bias
        )
        
        email_score = 0.1 # Base queue/email score

        scores = {
            "ws": ws_score,
            "push": push_score,
            "whatsapp": whatsapp_score,
            "email": email_score
        }

        # Select highest scoring channel
        selected = max(scores, key=scores.get)
        
        # If offline, force WS to 0 and re-select
        if not is_online and selected == "ws":
            scores["ws"] = 0.0
            selected = max(scores, key=scores.get)

        return {
            "selected_channel": selected,
            "confidence": round(scores[selected], 4),
            "fallback_chain": self._build_fallback(scores, selected),
            "reason": [
                "presence_online" if is_online else "presence_offline",
                "high_availability" if avail_score > 0.75 else "low_availability",
                "high_urgency" if urgency > 0.7 else "standard_urgency"
            ]
        }

    def _build_fallback(self, scores, selected):
        sorted_channels = sorted(scores.keys(), key=lambda k: scores[k], reverse=True)
        return [c for c in sorted_channels if c != selected]

smart_router = SmartRouter()
