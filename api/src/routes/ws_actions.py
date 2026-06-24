from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from src.realtime.ws_gateway import manager
import json
from src.services.presence_manager import presence_manager

router = APIRouter()

@router.websocket("/ws/actions/{profile_id}")
async def ws_endpoint(ws: WebSocket, profile_id: str):
    await manager.connect(profile_id, ws)

    try:
        while True:
            # Keep connection alive
            data = await ws.receive_text()
            
            # Handle heartbeat for presence
            try:
                msg = json.loads(data)
                if msg.get("type") == "HEARTBEAT":
                    presence_manager.heartbeat(profile_id)
            except Exception:
                pass
                
            if data == "ping":
                await ws.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(profile_id)
    except Exception:
        manager.disconnect(profile_id)
