from enum import Enum


class ActorType(str, Enum):
    SYSTEM = "system"
    BUSINESS_OWNER = "business_owner"
    CUSTOMER = "customer"


class EntityType(str, Enum):
    CONTENT_POST = "content_post"
    QUOTE_REQUEST = "quote_request"
    PROFILE = "profile"
    OPPORTUNITY = "opportunity"
    MEDIA = "media"
    CAMPAIGN = "campaign"
    REFLECTION = "reflection"
    MESSAGE_TEMPLATE = "message_template"


class ContinuityEventType(str, Enum):
    CONTENT_GENERATED = "content_generated"
    CONTENT_CREATED_MANUALLY = "content_created_manually"
    CONTENT_UPDATED = "content_updated"
    CONTENT_DELETED = "content_deleted"
    CONTENT_SHARED = "content_shared"

    CONTENT_GUARDRAIL_TRIGGERED = "content_guardrail_triggered"
    CTA_PROFILE_SELECTED = "cta_profile_selected"
    PLATFORM_FORMAT_APPLIED = "platform_format_applied"
    TEMPLATE_SELECTED = "template_selected"
    PUBLIC_CAPTION_COMPOSED = "public_caption_composed"

    QUOTE_REQUEST_RECEIVED = "quote_request_received"
    QUOTE_REQUEST_STATUS_UPDATED = "quote_request_status_updated"

    ENTITY_CREATED = "entity_created"
    ENTITY_UPDATED = "entity_updated"
    ENTITY_DELETED = "entity_deleted"
