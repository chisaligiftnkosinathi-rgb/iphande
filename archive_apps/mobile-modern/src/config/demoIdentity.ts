/**
 * Demo seeds are for intentional demonstration mode only.
 * They must never be used as fallback identity in production flows.
 *
 * Boundary Rules:
 * 1. Demo seed data must never write into a real steward account.
 * 2. Real steward data must never read demo seed data unless demo mode is explicitly enabled.
 */

export interface DemoSeedProfile {
    seed_id: string;
    archetype_key: string;
    profile_name: string;
    business_line: string;
    location: string;
    story: string;
    sample_opportunities?: any[];
    sample_content?: any[];
    sample_quote_requests?: any[];
    sample_timeline_events?: any[];
    is_demo: boolean;
    can_promote_to_real: boolean;
}

export const DEMO_SEED_REGISTRY: Record<string, DemoSeedProfile> = {
    tech_digital_services: {
        seed_id: 'seed_global_it_001',
        archetype_key: 'tech_digital_services',
        profile_name: 'Gift Chisali',
        business_line: 'App Development & IT Support',
        location: 'Emalahleni, Mpumalanga, South Africa',
        story: 'Global IT and Business Solutions (Pty) Ltd helps communities, small businesses, churches, and professionals simplify digital complexity.',
        is_demo: true,
        can_promote_to_real: false
    },
    commission_based_sales: {
        seed_id: 'seed_monica_twala_001',
        archetype_key: 'commission_based_sales',
        profile_name: 'Monica Twala',
        business_line: 'Funeral Policy Steward',
        location: 'Soweto, Gauteng, South Africa',
        story: 'Helping families prepare with dignity through reliable funeral cover and compassionate community service.',
        is_demo: true,
        can_promote_to_real: false
    },
    food_and_catering: {
        seed_id: 'seed_mama_joy_001',
        archetype_key: 'food_and_catering',
        profile_name: 'Mama Joy',
        business_line: 'Kota Shop & Catering',
        location: 'Tembisa, Gauteng, South Africa',
        story: 'Serving the community with love, one kota at a time. We cater for local events, weddings, and daily meals.',
        is_demo: true,
        can_promote_to_real: false
    },
    community_ministry_steward: {
        seed_id: 'seed_pastor_john_001',
        archetype_key: 'community_ministry_steward',
        profile_name: 'Pastor John',
        business_line: 'Community Ministry',
        location: 'Pretoria, Gauteng, South Africa',
        story: 'Guiding the youth and supporting families through faith, action, and community outreach programs.',
        is_demo: true,
        can_promote_to_real: false
    }
};
