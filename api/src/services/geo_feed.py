import math
from datetime import datetime, timezone

from src.services.public_profiles import get_public_profiles
# Assuming get_opportunities_nearby exists, if not we will fetch it.
# We will import the models so we can query if the service doesn't exist.
from src.models.opportunity import Opportunity

def haversine_km(lat1, lon1, lat2, lon2):
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return 9999.0
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat/2)**2 +
        math.cos(math.radians(lat1)) *
        math.cos(math.radians(lat2)) *
        math.sin(dlon/2)**2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def distance_score_km(distance_km: float) -> float:
    if distance_km <= 5:
        return 1.0
    if distance_km <= 10:
        return 0.8
    if distance_km <= 25:
        return 0.6
    if distance_km <= 50:
        return 0.3
    return 0.1

def relevance_score(entity_archetype: str, filter_archetype: str | None) -> float:
    if not filter_archetype:
        return 0.6
    if not entity_archetype:
        return 0.2
    if entity_archetype == filter_archetype:
        return 1.0
    if entity_archetype.split("_")[0] == filter_archetype.split("_")[0]:
        return 0.7
    return 0.2

def freshness_score(dt: datetime | None) -> float:
    if not dt:
        return 0.2
    # Ensure dt is timezone aware for comparison
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    now = datetime.now(timezone.utc)
    days = (now - dt).days
    if days < 1:
        return 1.0
    if days < 7:
        return 0.8
    if days < 30:
        return 0.5
    return 0.2

def quality_score(profile) -> float:
    score = 0.0
    if getattr(profile, 'short_bio', None):
        score += 0.3
    if getattr(profile, 'logo_url', None):
        score += 0.2
    if getattr(profile, 'location', None):
        score += 0.2
    if getattr(profile, 'services', None):
        score += 0.3
    return min(score, 1.0)

def urgency_score(opportunity) -> float:
    status = getattr(opportunity, 'status', 'open')
    if status == "urgent":
        return 1.0
    if status == "open":
        return 0.6
    return 0.2

def geo_rank_profile(p, distance, archetype, mode):
    return (
        distance_score_km(distance) * 0.50 +
        relevance_score(p.business_category_key, archetype) * 0.25 +
        freshness_score(p.created_at) * 0.10 +
        quality_score(p) * 0.15
    )

def geo_rank_opportunity(o, distance, archetype, mode):
    return (
        distance_score_km(distance) * 0.40 +
        relevance_score(o.archetype, archetype) * 0.30 +
        freshness_score(o.created_at) * 0.25 +
        urgency_score(o) * 0.05
    )

def to_feed_profile(p, score, distance):
    return {
        "type": "profile",
        "id": str(p.id),
        "slug": p.slug,
        "title": p.name,
        "subtitle": p.short_bio,
        "archetype": p.business_category_key,
        "location": p.location,
        "latitude": p.latitude,
        "longitude": p.longitude,
        "distance_km": round(distance, 2),
        "score": round(score, 3),
        "created_at": p.created_at.isoformat() if p.created_at else None,
        "image_url": p.logo_url
    }

def to_feed_opportunity(o, score, distance):
    return {
        "type": "opportunity",
        "id": str(o.id),
        "title": getattr(o, 'title', None),
        "subtitle": getattr(o, 'description', None),
        "archetype": getattr(o, 'archetype', None),
        "budget": getattr(o, 'budget', None),
        "location": getattr(o, 'location', None) or getattr(o, 'city', None),
        "latitude": o.latitude,
        "longitude": o.longitude,
        "distance_km": round(distance, 2),
        "score": round(score, 3),
        "created_at": o.created_at.isoformat() if o.created_at else None
    }

def build_geo_feed(db, latitude, longitude, archetype, mode, limit, radius_km):
    
    profiles = get_public_profiles(db, archetype=archetype)
    
    # Inline opportunity fetch for nearby
    opp_query = db.query(Opportunity).filter(Opportunity.is_public == True)
    if archetype and mode == "strict":
        opp_query = opp_query.filter(Opportunity.archetype == archetype)
    opportunities = opp_query.all()

    items = []

    for p in profiles:
        distance = haversine_km(latitude, longitude, getattr(p, 'latitude', None), getattr(p, 'longitude', None))
        # Only use strict radius filtering if location is provided and valid
        if distance <= radius_km or distance == 9999.0: # Fallback for no location
            score = geo_rank_profile(p, distance, archetype, mode)
            items.append(to_feed_profile(p, score, distance))

    for o in opportunities:
        distance = haversine_km(latitude, longitude, getattr(o, 'latitude', None), getattr(o, 'longitude', None))
        if distance <= radius_km or distance == 9999.0:
            score = geo_rank_opportunity(o, distance, archetype, mode)
            items.append(to_feed_opportunity(o, score, distance))

    items.sort(key=lambda x: x["score"], reverse=True)

    return {
        "items": items[:limit],
        "meta": {
            "mode": mode,
            "count": len(items[:limit]),
            "center": {
                "latitude": latitude,
                "longitude": longitude
            }
        }
    }
