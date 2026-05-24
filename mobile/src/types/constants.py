from enum import Enum

class ActorType(str, Enum):
    system = "system"
    business_owner = "business_owner"
    customer = "customer"

class ContinuityEventType(str, Enum):
    content_generated = "content_generated"
    content_created_manually = "content_created_manually"
    content_updated = "content_updated"
    content_deleted = "content_deleted"
    content_shared = "content_shared"
    quote_request_received = "quote_request_received"
    quote_request_status_updated = "quote_request_status_updated"
    entity_created = "entity_created"
    entity_updated = "entity_updated"
    template_selected = "template_selected"
    public_caption_composed = "public_caption_composed"
    platform_format_applied = "platform_format_applied"
