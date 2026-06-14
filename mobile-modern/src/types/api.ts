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
    continuity_event_id?: string | null;

    // V1 Visibility Fields
    suburb?: string | null;
    city?: string | null;
    province?: string | null;
    services?: string | null;
    supporting_image_urls?: string | null;
    whatsapp_number?: string | null;
    cover_photo_url?: string | null;
    logo_url?: string | null;
    short_bio?: string | null;
    is_public?: boolean | null;

    // V1 Onboarding & Setup Fee
    setup_fee_required?: number | null;
    setup_fee_status?: string | null;
    setup_fee_proof_url?: string | null;
    setup_fee_paid_at?: string | null;
    setup_fee_review_note?: string | null;
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
    | "quote_requested"
    | "quote_reviewed"
    | "quote_contacted"
    | "quote_converted"
    | "quote_closed"
    | "new"
    | "contacted"
    | "quoted"
    | "accepted"
    | "declined"
    | "closed"
    | "application_submitted"
    | "evidence_review_pending"
    | "sale_confirmed";

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

export type QuoteStatus =
    | "quote_drafted"
    | "quote_reviewed"
    | "quote_sent"
    | "quote_accepted"
    | "quote_declined"
    | "quote_expired"
    | "quote_converted"
    | "issued"
    | "accepted"
    | "declined";

export interface Quote {
    id: string;
    business_owner_id: string;
    customer_request_id?: string | null;
    customer_name: string;
    customer_phone?: string | null;
    description: string;
    amount: string;
    currency: string;
    terms?: string | null;
    status: QuoteStatus;
    continuity_event_id: string;
    accepted_continuity_event_id?: string | null;
    created_at: string;
    sent_at?: string | null;
    accepted_at?: string | null;
}

export type PaymentReviewStatus =
    | "evidence_awaiting"
    | "evidence_submitted"
    | "under_review"
    | "verified"
    | "rejected"
    | "pending"
    | "confirmed"
    | "failed";

export type EvidenceStatus =
    | "submitted"
    | "evidence_check_passed"
    | "evidence_check_failed";

export interface PaymentIntentReview {
    payment_intent_id: string;
    quote_id: string;
    quote_request_id?: string | null;
    business_owner_id: string;
    customer_name?: string | null;
    amount: string;
    currency: string;
    status: PaymentReviewStatus;
    payment_reference: string;
    receipt_number?: string | null;
    latest_proof_file_name?: string | null;
    evidence_status?: EvidenceStatus | null;
    evidence_notes?: string | null;
    extracted_reference?: string | null;
    created_at: string;
    updated_at?: string | null;
}

export interface InventoryBalance {
    item_id: string;
    item_name: string;
    sku: string;
    unit: string;
    current_balance: number;
    latest_movement_date?: string;
    latest_movement_reason?: string;
}

export interface InventoryMovementRow {
    movement_id: string;
    item_id: string;
    change: number;
    reason: string;
    created_at: string;
    lineage_sequence: number;
    replay_event_id?: string;
}

export interface CommissionLedgerPipeline {
    activeLeads: number;
    quotesDrafted: number;
    applicationsPending: number;
    expectedCommission: string;
}

export interface CommissionLedgerCashReality {
    commissionApproved: string;
    commissionPaid: string;
    commissionClawedBack: string;
    availableCash: string;
}

export interface CommissionLedgerResponse {
    pipeline: CommissionLedgerPipeline;
    cashReality: CommissionLedgerCashReality;
    truthBoundary: string;
}
