from src.models.action_packet import ActionPacket
from src.models.engagement_event import EngagementEvent
from src.services.smart_router import smart_router
from src.realtime.ws_gateway import manager
import asyncio

def generate_title(event: EngagementEvent, action: str) -> str:
    if action == "VIEW_MATCH":
        return "New Match Available"
    elif action == "NAVIGATE_NOW":
        return "Urgent Work Nearby"
    elif action == "INSTANT_REQUEST_QUOTE":
        return "High Priority Request"
    return "New Action Required"

def generate_body(event: EngagementEvent, action: str) -> str:
    return f"We found an opportunity that strongly matches your profile! Take action: {action}"

def build_action_packets(event: EngagementEvent) -> list[ActionPacket]:
    packets = []
    actions = event.suggested_actions or []

    # Calculate base urgency to feed to smart router
    urgency_score = getattr(event, 'urgency_score', 0.5)
    
    from src.services.fraud.fraud_detector import fraud_detector
    risk = fraud_detector.get_risk(event.actor_id)
    
    if risk == "critical":
        return [] # Block delivery entirely

    for action in actions:
        
        # 1. Ask Smart Router for decision
        routing = smart_router.route({"priority": urgency_score}, event.actor_id)
        selected_channel = routing["selected_channel"]
        
        # 2. Safety Gate: Downgrade channel if high risk
        if risk == "high":
            selected_channel = "in_app_only"
            routing["confidence"] = 0.0
            routing["fallback_chain"] = []
        
        packets.append(ActionPacket(
            recipient_id=event.actor_id,
            event_id=str(event.id),
            channel=selected_channel,
            title=generate_title(event, action),
            body=generate_body(event, action),
            action_type=action,
            priority=urgency_score,
            ttl_seconds=3600,
            metadata_json={"routing_confidence": routing["confidence"], "fallback": routing["fallback_chain"]}
        ))

    return packets

async def queue(db, packets: list[ActionPacket]):
    for packet in packets:
        db.add(packet)
    db.commit()

    # REAL-TIME PUSH using new WS Gateway
    for packet in packets:
        if packet.channel == "ws" or "ws" in packet.metadata_json.get("fallback", []):
            await manager.send(
                packet.recipient_id,
                {
                    "type": "ACTION_PACKET",
                    "payload": {
                        "id": packet.id,
                        "event_id": packet.event_id,
                        "title": packet.title,
                        "body": packet.body,
                        "action_type": packet.action_type,
                        "channel": packet.channel,
                        "priority": packet.priority
                    }
                }
            )

    return {"queued": len(packets)}

def get_pending(db, profile_id: str) -> list[ActionPacket]:
    return db.query(ActionPacket).filter(
        ActionPacket.recipient_id == profile_id,
        ActionPacket.status == "pending"
    ).order_by(ActionPacket.priority.desc()).all()

def mark_delivered(db, action_id: str):
    packet = db.query(ActionPacket).filter(ActionPacket.id == action_id).first()
    if packet:
        packet.status = "delivered"
        db.commit()
        return {"status": "success"}
    return {"status": "not_found"}
