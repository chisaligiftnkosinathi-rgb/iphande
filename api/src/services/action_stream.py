from fastapi import WebSocket

class ActionStream:
    connections = {}  # profile_id -> list[WebSocket]

    @classmethod
    async def subscribe(cls, profile_id: str, websocket: WebSocket):
        cls.connections.setdefault(profile_id, []).append(websocket)

    @classmethod
    def unsubscribe(cls, profile_id: str, websocket: WebSocket):
        if profile_id in cls.connections:
            if websocket in cls.connections[profile_id]:
                cls.connections[profile_id].remove(websocket)
            if not cls.connections[profile_id]:
                del cls.connections[profile_id]

    @classmethod
    async def push(cls, profile_id: str, packet: dict):
        if profile_id not in cls.connections:
            return

        for ws in cls.connections[profile_id]:
            try:
                await ws.send_json(packet)
            except Exception:
                # Connection might be dead
                pass
