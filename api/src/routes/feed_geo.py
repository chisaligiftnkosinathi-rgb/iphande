from fastapi import APIRouter, Query, Depends
from src.services.geo_feed import build_geo_feed
from src.database import get_db

router = APIRouter(prefix="/feed", tags=["Geo Feed"])

from src.services.demand_engine import DemandEngine
from src.services.signal_aggregator import build_signals_from_context
from src.jobs.demand_precompute_job import demand_cache as memory_cache
from src.services.demand_redis import DemandRedisCache

redis_cache = DemandRedisCache()

@router.get("/geo")
def geo_feed(
    latitude: float,
    longitude: float,
    archetype: str | None = None,
    mode: str = "strict",
    limit: int = 30,
    radius_km: int = 25,
    db = Depends(get_db)
):
    feed_items = build_geo_feed(
        db=db,
        latitude=latitude,
        longitude=longitude,
        archetype=archetype,
        mode=mode,
        limit=limit,
        radius_km=radius_km
    )

    demand_engine = DemandEngine()
    signals = build_signals_from_context(latitude, longitude)
    
    enhanced_feed = []
    for item in feed_items:
        # Note: geo_cell logic should really map correctly. We use a mock here.
        mock_geo_cell = f"cell_{round(latitude, 2)}_{round(longitude, 2)}"
        archetype = getattr(item, 'archetype', None) or getattr(item, 'business_category_key', None) or "general"
        
        # 1. L1 Memory Cache
        cached = memory_cache.get(mock_geo_cell, archetype)
        if cached:
            demand = cached
        else:
            # 2. L2 Redis Cache
            try:
                cached = redis_cache.get(mock_geo_cell, archetype)
            except Exception:
                # Fallback gracefully if Redis is down
                cached = None

            if cached:
                memory_cache.set(mock_geo_cell, archetype, cached)
                demand = cached
            else:
                # 3. Compute (MISS path)
                demand = demand_engine.compute_demand_score(
                    signals=signals,
                    archetype=archetype,
                    geo_cell=mock_geo_cell
                )
                # 4. Write both caches
                try:
                    redis_cache.set(mock_geo_cell, archetype, demand)
                except Exception:
                    pass
                memory_cache.set(mock_geo_cell, archetype, demand)
        
        # Turn into dict to add demand_context
        # Depending on if item is a Pydantic model or dict, handle appropriately.
        # Here we assume it's a dict or object with __dict__
        item_dict = item.dict() if hasattr(item, 'dict') else (item.__dict__ if hasattr(item, '__dict__') else item)
        if hasattr(item_dict, '_sa_instance_state'):
            del item_dict['_sa_instance_state']
            
        item_dict["demand_context"] = {
            "score": demand["demand_score"],
            "trend": "stable",
            "components": demand["components"]
        }
        enhanced_feed.append(item_dict)

    from src.services.demand_pubsub import demand_pubsub
    demand_pubsub.publish(
        channel="geo.events",
        event_type="geo_feed_viewed",
        entity_type="feed",
        entity_id=f"feed_{round(latitude, 2)}_{round(longitude, 2)}",
        geo_data={
            "lat": latitude,
            "lng": longitude,
            "cell": f"cell_{round(latitude, 2)}_{round(longitude, 2)}"
        },
        payload={"limit": limit, "mode": mode, "archetype_filter": archetype},
        source="geo_feed"
    )

    return enhanced_feed
