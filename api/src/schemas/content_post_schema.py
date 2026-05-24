from pydantic import BaseModel, ConfigDict
from typing import Any

# Schema for generated content post response
class GeneratedContentPostOut(BaseModel):
    id: str | None = None
    content_post_id: str | None = None
    events: list[dict[str, Any]] = []
    event_count: int = 0
    # Old fields for backward compatibility
    content: str | None = None
    default_cta: str | None = None
    suggested_tags: list[str] = []
    profile_guidance: list[str] = []
    whatsapp_share_url: str | None = None
    facebook_share_url: str | None = None

    # Advanced business post creator fields
    caption: str
    platform: str
    hook: str
    offer: str
    trust_builder: str
    call_to_action: str
    quote_request_prompt: str
    hashtags: str | list[str]
    platform_notes: str
    business_category_key: str
    business_line: str
    goal_key: str | None = None
    rules_used: str
    deterministic: bool

    # Communication guardrails
    guardrail_violations: list[str] = []
    guardrails_passed: bool = True
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ContentPostCreate(BaseModel):
    owner_profile_id: str
    business_line: str
    channel: str
    post_type: str
    title: str
    body: str
    call_to_action: str
    linked_media_id: Optional[str] = None
    linked_campaign_id: Optional[str] = None

class ContentPostUpdate(BaseModel):
    business_line: Optional[str]
    channel: Optional[str]
    post_type: Optional[str]
    title: Optional[str]
    body: Optional[str]
    call_to_action: Optional[str]
    whatsapp_share_url: Optional[str]
    facebook_share_url: Optional[str]
    linked_media_id: Optional[str]
    linked_campaign_id: Optional[str]
    status: Optional[str]

class ContentPostOut(BaseModel):
    id: str
    owner_profile_id: str
    business_line: str
    channel: str
    post_type: str
    title: str
    body: str
    call_to_action: str
    whatsapp_share_url: Optional[str]
    facebook_share_url: Optional[str]
    linked_media_id: Optional[str]
    linked_campaign_id: Optional[str]
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
