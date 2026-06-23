import os
import logging
from fastapi import APIRouter, Depends, HTTPException, Header, Request
from sqlalchemy.orm import Session

from src.database import get_db
from src.models.timeline_event import TimelineEvent
from src.schemas.river_schemas import RiverEventPayload, RiverEventResponse
from src.services.river_service import process_river_event
from src.services.river_security import verify_signature
from src.services.river_hash_chain import verify_ledger_event
from src.services.river_replay_engine import replay_chain
from src.routes.river_stream_routes import manager

router = APIRouter(prefix="/river", tags=["river"])
logger = logging.getLogger(__name__)

async def verify_river_auth(
    request: Request,
    authorization: str = Header(None),
    x_river_signature: str = Header(None, alias="X-River-Signature"),
    x_river_timestamp: str = Header(None, alias="X-River-Timestamp")
):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    
    parts = authorization.split(" ")
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid Authorization header format")
        
    token = parts[1]
    expected_secret = os.getenv("RIVER_SHARED_SECRET")
    
    if not expected_secret or token != expected_secret:
        logger.warning("River Bridge authentication failed. Invalid shared secret.")
        raise HTTPException(status_code=403, detail="Invalid River Shared Secret")
        
    # Phase 3: HMAC Signature Verification
    if not x_river_signature or not x_river_timestamp:
        logger.warning("River Bridge authentication failed. Missing signature headers.")
        raise HTTPException(status_code=401, detail="Missing HMAC signature or timestamp")
        
    # We must await the raw body or use the json payload to verify
    # FastAPI Depends runs before the body is fully parsed into Pydantic models in the route
    try:
        payload_dict = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")
        
    if not verify_signature(expected_secret, payload_dict, x_river_signature, x_river_timestamp):
        logger.warning("River Bridge authentication failed. Invalid HMAC signature.")
        raise HTTPException(status_code=401, detail="Invalid River signature")
        
    return True

@router.post("/event", response_model=RiverEventResponse)
async def receive_river_event(
    payload: RiverEventPayload,
    db: Session = Depends(get_db),
    _ = Depends(verify_river_auth)
):
    """
    Receives an event from AXIONYX and archives it into the timeline.
    """
    try:
        # Phase 4: Ledger Hash Chain Verification
        last_event = db.query(TimelineEvent).filter(TimelineEvent.event_type == "river_bridge_event").order_by(TimelineEvent.created_at.desc()).first()
        last_known_hash = "IPHANDE_RIVER_GENESIS"
        if last_event and last_event.description and " | Hash: " in last_event.description:
            last_known_hash = last_event.description.split(" | Hash: ")[1].split(" |")[0].strip()
            
        event_dict = payload.model_dump()
        if not verify_ledger_event(event_dict, last_known_hash):
            logger.error(f"Ledger verification failed for event {payload.event_id}. Expected prev_hash: {last_known_hash}")
            raise HTTPException(status_code=409, detail="River ledger chain validation failed")
            
        timeline_event = process_river_event(db, payload)
        
        # Phase 7: Live Stream Layer (Broadcast only verified truth)
        await manager.broadcast({
            "type": "VERIFIED_RIVER_EVENT",
            "data": event_dict
        })
        
        return RiverEventResponse(
            status="success",
            message=f"River event archived successfully to timeline {timeline_event.id}",
            event_id=payload.event_id
        )
    except Exception as e:
        logger.exception(f"Failed to process river event {payload.event_id}")
        raise HTTPException(status_code=500, detail="Failed to archive river event")

@router.get("/replay")
def replay_river():
    # To be implemented fully in Phase 4.3 with the Audit CLI 
    # (Requires storing raw payload JSON in TimelineEvent to rebuild reality)
    events = [] 
    genesis = "IPHANDE_RIVER_GENESIS"
    result = replay_chain(events, genesis)
    return result
