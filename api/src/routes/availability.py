from fastapi import APIRouter
from src.services.availability_engine import availability_engine

router = APIRouter(prefix="/availability", tags=["Availability Engine"])

@router.get("/{profile_id}")
def get_availability(profile_id: str):
    return availability_engine.compute(profile_id)
