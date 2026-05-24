from .funeral_cover_templates import FUNERAL_COVER_TEMPLATES
from .services_templates import SERVICES_TEMPLATES
from .retail_templates import RETAIL_TEMPLATES
from .church_templates import CHURCH_TEMPLATES
from .real_estate_templates import REAL_ESTATE_TEMPLATES

ALL_BLUEPRINTS = [
    *FUNERAL_COVER_TEMPLATES,
    *SERVICES_TEMPLATES,
    *RETAIL_TEMPLATES,
    *CHURCH_TEMPLATES,
    *REAL_ESTATE_TEMPLATES,
]

def get_blueprints_for_goal(
    goal_key: str,
    business_category_key: str | None = None,
    platform: str | None = None,
) -> list[dict]:
    scored_blueprints = []

    for blueprint in ALL_BLUEPRINTS:
        if blueprint["goal_key"] != goal_key:
            continue

        score = 10

        if business_category_key:
            if business_category_key not in blueprint["business_categories"]:
                continue
            score += 10

        if platform and platform in blueprint["platforms"]:
            score += 5

        scored_blueprints.append({
            "blueprint": blueprint,
            "score": score,
            "selection_reasons": {
                "goal_match": True,
                "business_category_match": bool(
                    business_category_key and business_category_key in blueprint["business_categories"]
                ),
                "platform_match": bool(platform and platform in blueprint["platforms"]),
            },
        })

    scored_blueprints.sort(key=lambda item: item["score"], reverse=True)
    return scored_blueprints

def format_blueprint_replay_payload(scored_blueprint: dict, goal_key: str, platform: str | None) -> dict:
    """
    Normalizes the blueprint selection for replay to preserve explainability
    without duplicating the entire template snapshot.
    """
    return {
        "template_key": scored_blueprint["blueprint"]["template_key"],
        "score": scored_blueprint["score"],
        "selection_reasons": scored_blueprint["selection_reasons"],
        "goal_key": goal_key,
        "platform": platform,
    }
