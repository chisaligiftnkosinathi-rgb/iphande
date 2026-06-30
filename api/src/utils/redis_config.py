from src.config import settings
import redis
import logging

logger = logging.getLogger(__name__)

def get_redis_client():
    """
    Get a Redis client. Returns None if Redis is not configured.

    This is defensive - optional infrastructure like Redis should not
    crash the entire application at import time if it's unavailable.
    """
    redis_url = settings.REDIS_URL

    # If REDIS_URL is not set or empty, Redis is optional
    if not redis_url or not redis_url.strip():
        logger.debug("Redis not configured (REDIS_URL empty). Running without cache.")
        return None

    # Validate URL format before attempting connection
    if not any(redis_url.startswith(scheme) for scheme in ["redis://", "rediss://", "unix://"]):
        logger.warning(f"Invalid REDIS_URL format. Must start with redis://, rediss://, or unix://. Got: {redis_url[:30]}...")
        return None

    try:
        client = redis.from_url(redis_url, decode_responses=True, socket_connect_timeout=1, socket_timeout=1)
        logger.info("Redis client initialized successfully")
        return client
    except Exception as e:
        logger.error(f"Failed to initialize Redis client: {type(e).__name__}: {str(e)}")
        return None
