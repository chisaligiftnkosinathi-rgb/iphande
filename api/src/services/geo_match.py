from src.services.geo_feed import haversine_km, distance_score_km, quality_score

def archetype_fit(profile_archetype: str | None, opportunity_archetype: str | None) -> float:
    if not profile_archetype or not opportunity_archetype:
        return 0.2

    if profile_archetype == opportunity_archetype:
        return 1.0

    if profile_archetype.split("_")[0] == opportunity_archetype.split("_")[0]:
        return 0.7

    return 0.2

def availability_score(profile) -> float:
    if getattr(profile, 'is_active', False):
        return 1.0
    return 0.2

def build_reasons(archetype_score, distance, quality):
    reasons = []

    if archetype_score == 1.0:
        reasons.append("exact archetype match")
    elif archetype_score == 0.7:
        reasons.append("related skill match")

    if distance < 5:
        reasons.append("very close proximity")
    elif distance < 20:
        reasons.append("nearby")

    if quality > 0.7:
        reasons.append("high profile completeness")

    return reasons

def match_opportunity_to_profiles(opportunity, profiles):
    matches = []

    for p in profiles:
        distance = haversine_km(
            getattr(opportunity, 'latitude', None),
            getattr(opportunity, 'longitude', None),
            getattr(p, 'latitude', None),
            getattr(p, 'longitude', None)
        )

        archetype = archetype_fit(getattr(p, 'business_category_key', None), getattr(opportunity, 'archetype', None))

        dist_score = distance_score_km(distance)
        quality = quality_score(p)
        availability = availability_score(p)

        score = (
            archetype * 0.40 +
            dist_score * 0.35 +
            quality * 0.15 +
            availability * 0.10
        )

        if score > 0.3:  # filter noise
            matches.append({
                "profile_id": str(p.id),
                "profile_slug": getattr(p, 'slug', None),
                "name": getattr(p, 'name', None),
                "archetype": getattr(p, 'business_category_key', None),
                "distance_km": round(distance, 2) if distance != 9999.0 else None,
                "match_score": round(score, 2),
                "reasons": build_reasons(archetype, distance, quality)
            })

    return sorted(matches, key=lambda x: x["match_score"], reverse=True)
