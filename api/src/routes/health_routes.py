from fastapi import APIRouter
from sqlalchemy import text
import logging

from src.config import settings
from src.database import engine

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/health")
def health_check():
    return {
        "status": "alive",
        "app": settings.APP_NAME,
        "version": settings.API_VERSION,
        "environment": settings.ENVIRONMENT,
    }


@router.get("/db-health")
def db_health_check():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except Exception as exc:
        logger.error("Database health check failed", exc_info=True, extra={"event": "db_health_check_failed"})
        return {
            "status": "degraded",
            "database": "unreachable"
        }

    return {
        "status": "ok",
        "database": "reachable",
    }

@router.get("/version")
def version_check():
    return {
        "name": settings.APP_NAME,
        "version": settings.API_VERSION,
        "build": "local" if settings.ENVIRONMENT == "development" else "unknown",
        "environment": settings.ENVIRONMENT
    }
