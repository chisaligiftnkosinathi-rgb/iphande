from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from src.services.action_stream import ActionStream
import asyncio

router = APIRouter(tags=["Realtime Delivery"])

@router.websocket("/ws/actions/{profile_id}")
async def action_stream_socket(websocket: WebSocket, profile_id: str):
    await websocket.accept()
    await ActionStream.subscribe(profile_id, websocket)

    try:
        while True:
            # We must keep the connection alive and listen for possible client pings/messages.
            data = await websocket.receive_text()
            # If the client sends a ping, we can respond if needed.
    except WebSocketDisconnect:
        ActionStream.unsubscribe(profile_id, websocket)
