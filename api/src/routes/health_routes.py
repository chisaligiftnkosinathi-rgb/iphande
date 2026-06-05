from fastapi import APIRouter
from sqlalchemy import text

from src.config import APP_NAME, API_VERSION, ENVIRONMENT
from src.database import engine

router = APIRouter()

@router.get("/health")
def health_check():
    return {
        "status": "alive",
        "app": APP_NAME,
        "version": API_VERSION,
        "environment": ENVIRONMENT,
    }


@router.get("/db-health")
def db_health_check():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except Exception as exc:
        return {
            "status": "degraded",
            "database": "unreachable",
            "detail": str(exc),
        }

    return {
        "status": "ok",
        "database": "reachable",
    }
