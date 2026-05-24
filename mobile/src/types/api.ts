// African-first business taxonomy
export interface BusinessCategory {
    name: string;
    description: string;
    lines: string[];
    tags: string[];
}
// Shared backend types for iPhande mobile app

// Example: Profile, Opportunity, Timeline, etc. (expand as you wire each screen)

export interface Profile {
    id: string;
    name: string;
    slug: string;
    avatarUrl?: string;
    location?: string;
    providerType?: string;
    businessType?: string;
    bio?: string;
    createdAt: string;
    updatedAt: string;
    // Deterministic business identity fields
    business_category_key?: string;
    business_line?: string;
    goal_key?: string;
    suggested_tags?: string[];
    profile_guidance?: string[];
    deterministic?: boolean;
}

// Deterministic content generation result
export interface ContentGenerationResult {
    id?: string;
    content_post_id?: string;
    content: string;
    business_category_key: string;
    business_line: string;
    goal_key?: string;
    template_key?: string;
    rules_used: string;
    default_cta: string;
    suggested_tags: string[];
    profile_guidance: string[];
    deterministic: boolean;
    whatsapp_share_url?: string;
    facebook_share_url?: string;

    // Governed replay fields
    caption: string;
    hashtags: string | string[];
    guardrails_passed: boolean;
    guardrail_violations: string[];
    events: any[];
    event_count: number;
}

export type ContentReviewStatus = "draft" | "approved" | "rejected" | "shared" | "deleted";

export interface ContentPost {
    id: string;
    owner_profile_id: string;
    business_line: string;
    channel: string;
    post_type: string;
    template_key?: string | null;
    title: string;
    body: string;
    call_to_action: string;
    whatsapp_share_url?: string | null;
    facebook_share_url?: string | null;
    linked_media_id?: string | null;
    linked_campaign_id?: string | null;
    status: ContentReviewStatus;
    created_at: string;
    updated_at: string;
}

export interface Opportunity {
    id: string;
    title: string;
    description: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    timeline: TimelineEvent[];
}

export interface TimelineEvent {
    id: string;
    type: string;
    description: string;
    createdAt: string;
}

// Add more types as you wire additional endpoints

// --- Quote Request Types ---
export type QuoteRequestStatus =
    | "new"
    | "contacted"
    | "quoted"
    | "accepted"
    | "declined"
    | "closed";

export interface QuoteRequestCreate {
    business_owner_id: string;
    business_category_key: string;
    business_line: string;
    post_id?: string;
    customer_name: string;
    customer_phone: string;
    customer_location?: string;
    service_needed?: string;
    preferred_date?: string;
    message?: string;
}

export interface QuoteRequest extends QuoteRequestCreate {
    id: string;
    status: QuoteRequestStatus;
    created_at: string;
    updated_at?: string | null;
}
