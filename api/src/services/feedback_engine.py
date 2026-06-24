from src.models.feedback_event import FeedbackEvent
from src.services.trust_engine import (
    increase_exposure_confidence,
    increase_engagement_trust,
    boost_reliability,
    massively_increase_all_trust,
    slightly_reduce_relevance_bias
)
from src.services.presence_manager import presence_manager

from src.services.fraud.signal_validity_engine import fraud_engine

def process_feedback(db, event: FeedbackEvent):
    # Protect system integrity - evaluate fraud before accepting signal
    svs = fraud_engine.evaluate_event(event)
    
    if svs < 0.5:
        # Drop signal silently; do not pollute the economic truth
        return event

    # Store the feedback first
    db.add(event)
    db.commit()
    db.refresh(event)

    # Track activity presence
    presence_manager.update_activity(event.profile_id, event.event_type)

    # Load Balancing Loop
    from src.services.economic_load_balancer import economic_load_balancer
    if event.event_type == "CONVERTED":
        # Successfully completed job - relieve pressure
        economic_load_balancer.record_completion(event.profile_id)
    elif event.event_type == "ABANDONED" or event.event_type == "DISMISSED":
        # Failed or ignored - increase load pressure to cool them down
        economic_load_balancer.record_abandonment(event.profile_id)

    # Dynamic system adaptation
    if event.event_type == "DISMISSED":
        slightly_reduce_relevance_bias(db, event.profile_id, svs=svs)

    if event.event_type == "CLICKED":
        increase_engagement_trust(db, event.profile_id, svs=svs)

    if event.event_type == "NAVIGATED":
        boost_reliability(db, event.profile_id, svs=svs)

    if event.event_type == "CONVERTED":
        massively_increase_all_trust(db, event.profile_id, svs=svs)
        
    if event.event_type == "VIEWED":
        increase_exposure_confidence(db, event.profile_id, svs=svs)

    # Publish to demand pub/sub event stream
    from src.services.demand_pubsub import demand_pubsub
    demand_pubsub.publish(
        channel="demand.events",
        event_type="feedback_received",
        entity_type="profile",
        entity_id=event.profile_id,
        geo_data={"lat": 0.0, "lng": 0.0, "cell": "global"}, # Wait, could extract from event.context if available
        payload={
            "feedback_action": event.event_type,
            "action_packet_id": event.action_packet_id,
        },
        source="feedback_engine"
    )

    return event
