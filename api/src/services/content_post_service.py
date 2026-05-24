from src.services.content.content_guardrails import validate_content
from collections import defaultdict

from src.data.content_templates.registry import get_blueprints_for_goal, get_content_template
from src.data.cta_profiles import get_cta
from src.replay.builder import build_in_memory_event
from src.models.constants import ContinuityEventType

def compose_public_caption(
    *,
    hook: str,
    offer: str,
    trust_builder: str | None,
    call_to_action: str,
    quote_request_prompt: str | None,
) -> str:
    parts = [
        hook.strip(),
        offer.strip(),
        trust_builder.strip() if trust_builder else "",
        quote_request_prompt.strip() if quote_request_prompt else "",
    ]
    return "\n".join(part for part in parts if part)

from src.services.content.platform_formatter import PlatformFormatter


from urllib.parse import quote_plus
from datetime import datetime
from src.data.business_content_rules import (
    get_content_rules,
    get_prompt_for_goal,
    get_profile_guidance,
    get_suggested_tags,
    PLATFORM_CONTENT_RULES,
)
from src.services.content_context_builder import build_generation_context

BUSINESS_CATEGORY_ALIASES = {
    "beauty_salon": "beauty_and_hair",
    "car_wash": "transport_and_delivery",
    "catering": "food_and_catering",
    "cleaning_services": "home_services",
    "tutoring": "education_and_training",
}

GOAL_ALIASES = {
    "request_bookings": "get_bookings",
    "booking_request": "get_bookings",
}


def normalize_business_category(category_key: str | None) -> str:
    if not category_key:
        return "general_business"
    return BUSINESS_CATEGORY_ALIASES.get(category_key, category_key)


def normalize_goal_key(goal_key: str | None) -> str | None:
    if not goal_key:
        return None
    return GOAL_ALIASES.get(goal_key, goal_key)


def safe_format(pattern: str, values: dict[str, str]) -> str:
    fallback_values = defaultdict(str, values)
    return pattern.format_map(fallback_values).strip()


def generate_content_post(data):
    try:
        # Deterministic, business-aware content generation
        business_category_key = normalize_business_category(data.get("business_category_key"))
        business_line = data.get("business_line") or ""
        goal_key = normalize_goal_key(data.get("goal_key"))
        platform = data.get("platform") or "facebook"
        offer_details = data.get("offer_details", "")
        location = data.get("location", "")
        contact_method = data.get("contact_method", "")
        tone = data.get("tone", "")

        rules = get_content_rules(business_category_key)
        template = get_content_template(business_category_key)
        blueprint_results = get_blueprints_for_goal(
            goal_key=goal_key,
            business_category_key=business_category_key,
            platform=platform,
        )
        selected_blueprint = blueprint_results[0]["blueprint"] if blueprint_results else None
        template_key = (
            selected_blueprint.get("template_key")
            if selected_blueprint
            else template.get("key")
        )
        prompt = get_prompt_for_goal(business_category_key, goal_key)
        tags = get_suggested_tags(business_category_key)
        guidance = get_profile_guidance(business_category_key)
        platform_rules = PLATFORM_CONTENT_RULES.get(platform, PLATFORM_CONTENT_RULES["facebook"])

        # 1. Build Operational Generation Context
        generation_context = build_generation_context(
            profile=data.get("profile"),  # Handles None gracefully if not yet fetched
            business_category_key=business_category_key,
            business_line=business_line,
            platform=platform,
            goal_key=goal_key,
            offer_details=offer_details,
            tone=tone,
            contact_method=contact_method,
            category_rules=rules,
        )

        events = []
        # Context Built Event
        events.append(build_in_memory_event(
            event_type="prompt_context_built",
            platform=platform,
            goal_key=goal_key,
            business_category_key=business_category_key,
            payload=generation_context
        ))

        # 2. Compose deterministic post sections
        # Guidance is used only for shaping, not for output

        # Use only public-facing content for hook (no duplication)
        template_values = {
            "business_line": business_line,
            "service_name": business_line or "Service",
            "product_name": business_line or "Product",
            "product_category": business_line or "Products",
            "location": location or "your area",
            "offer_details": offer_details,
            "contact_method": contact_method or "message",
        }

        if selected_blueprint and selected_blueprint.get("hook_pattern"):
            hook = safe_format(selected_blueprint["hook_pattern"], template_values)
        elif business_line and location:
            hook = f"{business_line} services available in {location}."
        elif business_line:
            hook = f"{business_line} services available."
        else:
            hook = ""

        if selected_blueprint and selected_blueprint.get("body_pattern"):
            offer = safe_format(selected_blueprint["body_pattern"], template_values)
        else:
            offer = offer_details.strip()

        trust_builders = template.get("trust_builders", [])
        trust_builder = trust_builders[0] if trust_builders else ""
        call_to_action = (
            safe_format(selected_blueprint["cta_pattern"], template_values)
            if selected_blueprint and selected_blueprint.get("cta_pattern")
            else get_cta(goal_key, platform)
        )
        quote_prompts = template.get("quote_prompts", {})
        quote_request_prompt = (
            quote_prompts.get(goal_key)
            or prompt
        )
        hashtags = " ".join([f"#{tag}" for tag in tags]) if platform != "whatsapp" else ""
        platform_notes = platform_rules["notes"]

        # Template selection event
        events.append(build_in_memory_event(
            event_type=ContinuityEventType.TEMPLATE_SELECTED,
            platform=platform,
            goal_key=goal_key,
            business_category_key=business_category_key,
            payload={
                "template_key": template_key,
                "business_line": business_line,
                "blueprint_selected": bool(selected_blueprint),
            }
        ))

        # Compose public-facing caption (no guidance)
        raw_public_caption = compose_public_caption(
            hook=hook,
            offer=offer,
            trust_builder=trust_builder,
            call_to_action=call_to_action,
            quote_request_prompt=quote_request_prompt,
        )
        # Communication guardrails: prohibited phrase validation
        prohibited_phrases = template.get("prohibited_phrases", [])
        guardrail_violations = validate_content(
            raw_public_caption,
            prohibited_phrases,
        )
        guardrails_passed = len(guardrail_violations) == 0
        # Public caption composed event
        events.append(build_in_memory_event(
            event_type=ContinuityEventType.PUBLIC_CAPTION_COMPOSED,
            platform=platform,
            goal_key=goal_key,
            business_category_key=business_category_key,
            payload={
                "guardrails_passed": guardrails_passed,
                "guardrail_violations": guardrail_violations
            }
        ))

        # Platform-specific caption (presentation only)
        caption = raw_public_caption

        # Preview for event emission
        caption_preview = caption[:120]

        # Apply platform formatting layer
        formatter = PlatformFormatter()
        formatted = formatter.format(
            platform=platform,
            content=raw_public_caption,
            default_cta=call_to_action,
            suggested_tags=tags,
        )
        # Platform format applied event
        events.append(build_in_memory_event(
            event_type=ContinuityEventType.PLATFORM_FORMAT_APPLIED,
            platform=platform,
            goal_key=goal_key,
            business_category_key=business_category_key,
            payload={
                "has_hashtags": bool(formatted.suggested_tags),
                "cta": formatted.default_cta
            }
        ))

        # WhatsApp share URL (body only)
        from urllib.parse import quote_plus
        wa_text = quote_plus(formatted.content)
        whatsapp_share_url = f"https://wa.me/?text={wa_text}"
        # Facebook share URL (no profile slug, just caption)
        facebook_share_url = None

        result = {
            # Old fields
            "content": formatted.content,
            "default_cta": formatted.default_cta,
            "suggested_tags": formatted.suggested_tags,
            "profile_guidance": guidance,
            "whatsapp_share_url": whatsapp_share_url,
            "facebook_share_url": facebook_share_url,
            # Advanced fields
            "caption": formatted.content,
            "platform": platform,
            "hook": hook,
            "offer": offer,
            "trust_builder": trust_builder,
            "call_to_action": call_to_action,
            "quote_request_prompt": quote_request_prompt,
            "hashtags": " ".join(formatted.suggested_tags),
            "platform_notes": platform_notes,
            "business_category_key": business_category_key,
            "business_line": business_line,
            "goal_key": goal_key,
            "template_key": template_key,
            "rules_used": business_category_key or "general_business",
            "deterministic": True,
            "caption_preview": formatted.content[:120],
            "guardrail_violations": guardrail_violations,
            "guardrails_passed": len(guardrail_violations) == 0,
            "events": events,
            "event_count": len(events),
        }
        print("GENERATOR RETURNING:", result)
        return result
    except Exception as e:
        print("Error generating content post:", e)
        return {"error": str(e)}
