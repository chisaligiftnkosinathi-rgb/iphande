from src.replay.builder import build_in_memory_event
from src.replay.constants import ContinuityEventType


def test_replay_builder_preserves_event_type():
    event = build_in_memory_event(
        event_type=ContinuityEventType.TEMPLATE_SELECTED,
        platform="facebook",
        goal_key="request_quotes",
        business_category_key="commission_based_sales",
    )

    assert event["event_type"] == ContinuityEventType.TEMPLATE_SELECTED
    assert event["platform"] == "facebook"
    assert event["goal_key"] == "request_quotes"
    assert event["business_category_key"] == "commission_based_sales"
    assert event["payload"] == {}
