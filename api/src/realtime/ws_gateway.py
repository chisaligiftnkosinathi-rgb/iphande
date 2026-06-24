import json
import asyncio
from fastapi import WebSocket
from src.services.presence_manager import presence_manager

class ConnectionManager:
    def __init__(self):
        self.connections: dict[str, WebSocket] = {}

    async def connect(self, profile_id: str, ws: WebSocket):
        await ws.accept()
        self.connections[profile_id] = ws
        # Track presence
        presence_manager.set_online(profile_id)

    def disconnect(self, profile_id: str):
        self.connections.pop(profile_id, None)
        # Update presence
        presence_manager.set_offline(profile_id)

    async def send(self, profile_id: str, message: dict):
        if profile_id in self.connections:
            try:
                await self.connections[profile_id].send_json(message)
            except Exception:
                self.disconnect(profile_id)

async def redis_listener(pubsub, manager: ConnectionManager):
    while True:
        message = pubsub.get_message(ignore_subscribe_messages=True)

        if message and message["type"] == "message":
            event = json.loads(message["data"])

            # Basic routing rule
            target_profile = event.get("entity_id")
            
            # Note: For geo/demand events, we might need a broader fanout (e.g., matching online users by region).
            # But for v1 real-time, if the target profile is specified, we push directly.
            if target_profile:
                await manager.send(target_profile, {
                    "type": event["event_type"],
                    "payload": event
                })
        
        await asyncio.sleep(0.01)

manager = ConnectionManager()
