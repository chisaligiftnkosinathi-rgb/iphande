from src.config import settings
import redis

def get_redis_client():
    redis_url = settings.REDIS_URL
    return redis.from_url(redis_url, decode_responses=True, socket_connect_timeout=1, socket_timeout=1)
