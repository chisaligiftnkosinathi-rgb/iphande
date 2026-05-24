from typing import Any, Dict
from src.models.profile import Profile

def build_generation_context(
    profile: Profile | None,
    business_category_key: str,
    business_line: str,
    platform: str,
    goal_key: str,
    offer_details: str,
    tone: str,
    contact_method: str = "WhatsApp",
    category_rules: dict = None,
) -> Dict[str, Any]:
    """
    Builds a deterministic structured context for content generation.
    This binds the business profile, operational reality, and stewardship
    posture into a unified context before any AI or template generation occurs.
    """
    rules = category_rules or {}

    # Extract basic rules
    stewardship_constraints = rules.get("stewardship_constraints", [])
    default_tone = rules.get("default_tone", "professional")

    location_context = ""
    profile_name = "Business Owner"
    operational_reality = {}

    if profile:
        profile_name = profile.name
        if profile.operating_area:
            location_context = f"Operating in {profile.operating_area}"

        business_category_key = business_category_key or profile.business_category_key
        business_line = business_line or profile.business_line
        contact_method = profile.contact_method or contact_method

        operational_reality = {
            "services": profile.services,
            "offer_types": profile.offer_types,
            "pricing_style": profile.pricing_style,
            "availability": profile.availability,
            "languages": profile.languages,
            "trust_posture": profile.trust_posture,
            "service_radius_km": profile.service_radius_km,
        }

    # 3. Deterministic Profile Rules: Enforce strict bounds for specific high-trust business lines
    if business_category_key == "commission_based_sales" and "funeral" in (business_line or "").lower():
        stewardship_constraints.extend([
            "never use exaggerated guarantees",
            "use dignity-oriented wording",
            "no fear manipulation",
            "no fake urgency",
            "quote CTA preferred"
        ])

    return {
        "business_identity": {"name": profile_name, "business_line": business_line},
        "business_category": business_category_key,
        "platform": platform, "goal": goal_key, "offer": offer_details,
        "tone": tone or default_tone, "cta": contact_method,
        "location_context": location_context, "stewardship_constraints": list(set(stewardship_constraints)),
        "operational_reality": operational_reality,
    }
