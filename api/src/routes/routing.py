from fastapi import APIRouter
from src.services.smart_router import smart_router

router = APIRouter(prefix="/routing", tags=["Smart Routing Engine"])

@router.get("/decide/{action_id}/{profile_id}")
def debug_routing_decision(action_id: str, profile_id: str):
    # Mocking action urgency to test the router behavior
    mock_action = {"action_id": action_id, "priority": 0.8}
    return smart_router.route(mock_action, profile_id)
