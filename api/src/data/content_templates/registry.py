from src.data.content_templates.church_templates import CHURCH_TEMPLATES
from src.data.content_templates.funeral_cover_templates import FUNERAL_COVER_TEMPLATES
from src.data.content_templates.real_estate_templates import REAL_ESTATE_TEMPLATES
from src.data.content_templates.retail_templates import RETAIL_TEMPLATES
from src.data.content_templates.services_templates import SERVICES_TEMPLATES
from src.data.content_templates.practical_local_business_templates import (
    PRACTICAL_LOCAL_BUSINESS_TEMPLATES,
)
from src.data.content_templates.commission_based_sales import (
    COMMISSION_BASED_SALES_TEMPLATE,
)


GENERAL_BUSINESS_TEMPLATE = {
    "key": "general_business",
    "allowed_tones": ["professional", "friendly", "clear"],
    "trust_builders": [
        "Clear information is provided before you decide.",
        "You can ask questions before choosing an option.",
    ],
    "quote_prompts": {
        "promote_today": "This post is designed to share today's offer clearly.",
        "get_bookings": "This post is designed to invite booking interest.",
        "build_trust": "This post is designed to help people understand the business.",
    },
    "platform_emphasis": {
        "facebook": "Use clear sections and simple language.",
        "whatsapp": "Keep the message direct and action-oriented.",
        "tiktok": "Keep the caption short and focused on the offer.",
    },
    "prohibited_phrases": [
        "limited time only",
        "guaranteed",
        "act now before it is too late",
        "best deal ever",
    ],
}

RETAIL_AND_TRADING_TEMPLATE = {
    "key": "retail_and_trading",
    "allowed_tones": ["clear", "friendly", "practical"],
    "trust_builders": [
        "Stock and pricing information is shared honestly.",
        "Customers can ask questions before ordering or visiting.",
    ],
    "quote_prompts": {
        "promote_today": "This post is designed to promote available stock without fake urgency.",
        "share_price_list": "This post is designed to share prices clearly.",
        "announce_availability": "This post is designed to explain what is available now.",
        "build_trust": "This post is designed to build confidence through clear product information.",
    },
    "platform_emphasis": {
        "facebook": "Use clear product details and simple ordering instructions.",
        "whatsapp": "Keep the message short, practical, and easy to forward.",
        "tiktok": "Lead with the product and keep the caption concise.",
    },
    "prohibited_phrases": [
        "limited time only",
        "guaranteed cheapest",
        "everyone must buy",
        "act now before it is too late",
        "best deal ever",
    ],
}

CATEGORY_CONTENT_TEMPLATES = {
    "general_business": GENERAL_BUSINESS_TEMPLATE,
    "commission_based_sales": COMMISSION_BASED_SALES_TEMPLATE,
    "retail_and_trading": RETAIL_AND_TRADING_TEMPLATE,
}

BLUEPRINTS = [
    *FUNERAL_COVER_TEMPLATES,
    *REAL_ESTATE_TEMPLATES,
    *RETAIL_TEMPLATES,
    *PRACTICAL_LOCAL_BUSINESS_TEMPLATES,
    *SERVICES_TEMPLATES,
    *CHURCH_TEMPLATES,
]


def get_content_template(category_key: str | None):
    if not category_key:
        return GENERAL_BUSINESS_TEMPLATE
    return CATEGORY_CONTENT_TEMPLATES.get(category_key, GENERAL_BUSINESS_TEMPLATE)


def get_blueprints_for_goal(
    *,
    goal_key: str | None,
    business_category_key: str | None = None,
    platform: str | None = None,
) -> list[dict]:
    results = []

    for blueprint in BLUEPRINTS:
        if goal_key and blueprint.get("goal_key") != goal_key:
            continue

        categories = blueprint.get("business_categories", [])
        if business_category_key and business_category_key not in categories:
            continue

        platforms = blueprint.get("platforms", [])
        goal_match = bool(goal_key and blueprint.get("goal_key") == goal_key)
        business_category_match = bool(
            business_category_key and business_category_key in categories
        )
        platform_match = bool(platform and platform in platforms)

        score = 0
        if goal_match:
            score += 10
        if business_category_match:
            score += 10
        if platform_match:
            score += 5

        results.append(
            {
                "blueprint": blueprint,
                "score": score,
                "selection_reasons": {
                    "goal_match": goal_match,
                    "business_category_match": business_category_match,
                    "platform_match": platform_match,
                },
            }
        )

    return sorted(results, key=lambda result: result["score"], reverse=True)
