export type ActivationStatus = 'pending' | 'pending_review' | 'active' | 'rejected';

export interface StewardProfile {
    // Core identity
    id: string;
    owner_id: string;
    name?: string;
    slug?: string;
    email?: string;

    // Legacy / combined fields
    uid: string;
    businessName?: string;
    archetype?: string;
    category?: string;
    mainService?: string;

    // Contact
    whatsapp?: string;
    phone?: string;
    whatsapp_number?: string;
    contact_method?: string;

    // Business identity
    provider_type?: string;
    business_category_key?: string;
    business_line?: string;
    services?: string;
    offer_types?: string;
    pricing_style?: string;
    languages?: string;
    trust_posture?: string;

    // Story
    short_bio?: string;
    steward_story?: string;

    // Location
    location?: string;
    operating_area?: string;
    address_label?: string;
    province?: string;
    city?: string;
    suburb?: string;
    service_radius_km?: number;
    service_area_notes?: string;
    location_is_public?: boolean;
    latitude?: number | null;
    longitude?: number | null;

    // Availability
    availability?: string;

    // Media
    logo_url?: string;
    company_logo_url?: string;
    cover_photo_url?: string;
    supporting_image_urls?: string | string[];

    // Proof of Work metadata (JSON: [{url, title, completed_date, note}])
    proof_of_work_items?: string;

    // Status
    activationStatus: ActivationStatus;
    onboardingComplete: boolean;
    setupFeeProofUrl?: string;
    setup_fee_status?: string;
    setup_fee_proof_url?: string;
    setup_fee_review_note?: string;
    is_verified?: boolean;
    onboarding_completed?: boolean;
    is_public?: boolean;
    created_at?: string;
    
    // Referral Program
    referral_code?: string;
    referred_by_code?: string;

    // Freemium Architecture
    plan_code?: string;
    subscription_active?: boolean;
    role?: string;
    allowed_features?: string[];
    platform_identity?: PlatformIdentity;
}

export type PlatformIdentity = 'SYSTEM_CREATOR' | 'SYSTEM_ADMIN' | 'STEWARD' | 'CUSTOMER' | 'PUBLIC_VISITOR';


export interface Referral {
    id: string;
    referred_profile_id: string;
    referral_code: string;
    status: 'pending' | 'qualified' | 'paid' | 'rejected';
    reason?: 'cap_reached' | 'self_referral' | 'duplicate' | 'admin_rejected';
    reward_amount: number;
    created_at: string;
    qualified_at?: string;
    paid_at?: string;
}

export interface ReferralMeResponse {
    referral_code?: string;
    successful_referrals: number;
    total_reward: number;
    referrals: Referral[];
}
