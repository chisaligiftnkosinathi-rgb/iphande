import time

class PresenceManager:
    def __init__(self):
        self.presence: dict[str, dict] = {}

    def set_online(self, profile_id: str, geo: dict = None):
        if not geo:
            geo = {"lat": 0.0, "lng": 0.0, "cell": "unknown"}
            
        self.presence[profile_id] = {
            "status": "online",
            "last_seen": time.time(),
            "geo": geo,
            "capabilities": {
                "can_receive_ws": True,
                "push_enabled": True,
                "whatsapp_enabled": False
            },
            "activity": {
                "last_action": None,
                "engagement_score": 0.5
            }
        }

    def set_offline(self, profile_id: str):
        if profile_id in self.presence:
            self.presence[profile_id]["status"] = "offline"
            self.presence[profile_id]["last_seen"] = time.time()

    def heartbeat(self, profile_id: str):
        if profile_id in self.presence:
            self.presence[profile_id]["last_seen"] = time.time()
            self.presence[profile_id]["status"] = "online"

    def get(self, profile_id: str):
        return self.presence.get(profile_id)
        
    def update_activity(self, profile_id: str, action: str):
        if profile_id in self.presence:
            self.presence[profile_id]["activity"]["last_action"] = action
            self.presence[profile_id]["last_seen"] = time.time()

presence_manager = PresenceManager()
