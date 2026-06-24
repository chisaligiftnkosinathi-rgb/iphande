from src.models.engagement_event import EngagementEvent
from src.database import SessionLocal

def compute_engagement_score(match_score: float, urgency_score: float, distance_km: float, opportunity_value_score: float = 0.5) -> float:
    # Inverse distance score
    if distance_km <= 5:
        proximity_score = 1.0
    elif distance_km <= 15:
        proximity_score = 0.7
    else:
        proximity_score = 0.3

    return (
        match_score * 0.4 +
        urgency_score * 0.3 +
        proximity_score * 0.2 +
        opportunity_value_score * 0.1
    )

def generate_actions(event: EngagementEvent):
    actions = []

    if event.type == "MATCH_READY":
        actions.append("VIEW_MATCH")
        actions.append("CONTACT_OPPORTUNITY")
        actions.append("SAVE_FOR_LATER")

    if getattr(event, 'distance_km', 9999) < 5:
        actions.append("NAVIGATE_NOW")

    if getattr(event, 'urgency_score', 0) > 0.8:
        actions.append("INSTANT_REQUEST_QUOTE")

    return actions

def should_engage(event: EngagementEvent) -> bool:
    # Only engage if the calculated score crosses a threshold, to prevent spam
    score = compute_engagement_score(
        event.relevance_score, 
        event.urgency_score, 
        event.distance_km
    )
    return score > 0.4

def enrich_with_actions(event: EngagementEvent) -> EngagementEvent:
    event.suggested_actions = generate_actions(event)
    return event

def store_engagement(db, event: EngagementEvent):
    db.add(event)
    db.commit()
    db.refresh(event)
    return event

def dispatch_engagement(event: EngagementEvent):
    # This will hook into Action Delivery Layer (Push notifications, SMS, WhatsApp)
    pass

def ingest_engagement_signal(db, event_data: dict):
    event = EngagementEvent(
        type=event_data["type"],
        actor_id=event_data["actor_id"],
        target_id=event_data["target_id"],
        context=event_data.get("context", {}),
        urgency_score=event_data.get("urgency_score", 0.0),
        relevance_score=event_data.get("relevance_score", 0.0),
        distance_km=event_data.get("distance_km", 9999.0)
    )

    if should_engage(event):
        event = enrich_with_actions(event)
        store_engagement(db, event)
        dispatch_engagement(event)
        return event
    
    return None

def get_engagements_for_profile(db, profile_id: str):
    return db.query(EngagementEvent).filter(EngagementEvent.actor_id == profile_id).order_by(EngagementEvent.created_at.desc()).limit(20).all()
