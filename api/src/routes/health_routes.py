from fastapi import APIRouter
from src.config import APP_NAME, API_VERSION, ENVIRONMENT

router = APIRouter()

@router.get("/health")
def health_check():
    return {
        "status": "alive",
        "app": APP_NAME,
        "version": API_VERSION,
        "environment": ENVIRONMENT,
    }
