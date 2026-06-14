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
    # Content Lifecycle
    CONTENT_GENERATED = "content_generated"
    CONTENT_CREATED_MANUALLY = "content_created_manually"
    CONTENT_UPDATED = "content_updated"
    CONTENT_DELETED = "content_deleted"
    CONTENT_SHARED = "content_shared"

    # Generation Steps
    PROMPT_CONTEXT_BUILT = "prompt_context_built"
    CONTENT_GUARDRAIL_TRIGGERED = "content_guardrail_triggered"
    TONE_SELECTED = "tone_selected"
    CTA_SELECTED = "cta_selected"
    CTA_PROFILE_SELECTED = "cta_profile_selected"
    PLATFORM_FORMAT_APPLIED = "platform_format_applied"
    TEMPLATE_SELECTED = "template_selected"
    PUBLIC_CAPTION_COMPOSED = "public_caption_composed"
    BLUEPRINT_REGISTRY_LOADED = "blueprint_registry_loaded"
    BLUEPRINT_SELECTED = "blueprint_selected"
    BLUEPRINT_VARIABLES_RESOLVED = "blueprint_variables_resolved"
    BLUEPRINT_CONSTRAINTS_APPLIED = "blueprint_constraints_applied"

    # Quote Requests
    QUOTE_REQUEST_RECEIVED = "quote_request_received"
    QUOTE_REQUEST_STATUS_UPDATED = "quote_request_status_updated"

    # Generic Lifecycles
    ENTITY_CREATED = "entity_created"
    ENTITY_UPDATED = "entity_updated"
    ENTITY_DELETED = "entity_deleted"

PLAN_FEATURES = {
    "free": ["profile", "visibility", "leads", "opportunities"],
    "verified_once_off": ["verified_badge"],
    "documents": ["quotes", "invoices", "receipts", "pdf_downloads"],
    "continuity": ["proof_of_work", "timeline_evidence", "replay"],
    "business": ["verified_badge", "quotes", "invoices", "receipts", "proof_of_work", "expenses", "inventory", "reports", "export"]
}
