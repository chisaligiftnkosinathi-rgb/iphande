// Governed archetype-to-screen access registry for iPhande mobile
// Shapes relevance only—never restricts dignity or creates authority

// Core continuity screens always present for every archetype
export const CORE_CONTINUITY_SCREENS = [
    'Home',
    'Profile',
    'Media',
    'Timeline',
    'AboutUs',
    'Acknowledgements',
    'Music',
    'ContinuityPrinciples',
    'Support'
];

// Map archetype keys to relevant screen route names
export const ARCHETYPE_SCREEN_ACCESS: Record<string, string[]> = {
    tech_digital_services: [
        ...CORE_CONTINUITY_SCREENS,
        'Opportunities',
        'QuoteRequestsDashboard',
        'ContentGenerator',
        'InventoryLedger',
        'GivingSupport',
        'DocumentComposer',
        'Campaigns',
        'CommissionLedger'
    ],
    food_and_catering: [
        ...CORE_CONTINUITY_SCREENS,
        'InventoryLedger',
        'QuoteRequestsDashboard',
        'Campaigns',
        'GivingSupport',
        'Opportunities',
    ],
    commission_based_sales: [
        ...CORE_CONTINUITY_SCREENS,
        'LeadQuoteCapture',
        'QuoteRequestsDashboard',
        'ContentGenerator',
        'CommissionLedger',
        'Opportunities',
        'PaymentReview',
    ],
    local_retail_steward: [
        ...CORE_CONTINUITY_SCREENS,
        'InventoryLedger', // stock
        'Opportunities',   // specials, repeat customers
        'GivingSupport',
    ],
    retail_spaza: [
        ...CORE_CONTINUITY_SCREENS,
        'InventoryLedger',
        'GivingSupport',
        'Opportunities',
    ],
    beauty_wellness_steward: [
        ...CORE_CONTINUITY_SCREENS,
        'Opportunities',   // appointments, repeat clients
        'QuoteRequestsDashboard',
    ],
    food_catering_steward: [
        ...CORE_CONTINUITY_SCREENS,
        'Opportunities',   // daily offers, availability
        'InventoryLedger',
        'QuoteRequestsDashboard',
        'Campaigns',
        'GivingSupport',
    ],
    skilled_trades_steward: [
        ...CORE_CONTINUITY_SCREENS,
        'Opportunities',   // jobs, quotes
        'QuoteRequestsDashboard',
        'DocumentComposer',
    ],
    transport_delivery_steward: [
        ...CORE_CONTINUITY_SCREENS,
        'Opportunities',   // routes, coordination
    ],
    property_housing_steward: [
        ...CORE_CONTINUITY_SCREENS,
        'Opportunities',   // listings, inquiries
        'QuoteRequestsDashboard',
        'DocumentComposer',
    ],
    financial_insurance_steward: [
        ...CORE_CONTINUITY_SCREENS,
        'Opportunities',   // relationships, quotes
        'QuoteRequestsDashboard',
        'LeadQuoteCapture',
        'CommissionLedger',
        'PaymentReview',
    ],
    education_tutoring_steward: [
        ...CORE_CONTINUITY_SCREENS,
        'Opportunities',   // bookings, learners
        'DocumentComposer',
    ],
    creative_media_steward: [
        ...CORE_CONTINUITY_SCREENS,
        'Opportunities',
        'ContentGenerator',
        'Campaigns',
    ],
    community_ministry_steward: [
        ...CORE_CONTINUITY_SCREENS,
        'Opportunities',   // events, announcements
        'GivingSupport',
        'Campaigns',
    ],
    agriculture_farming_steward: [
        ...CORE_CONTINUITY_SCREENS,
        'InventoryLedger', // seasonality, supply
        'Opportunities',
        'GivingSupport',
    ],
    health_care_steward: [
        ...CORE_CONTINUITY_SCREENS,
        'Opportunities',   // trust, care continuity
        'DocumentComposer',
    ],
    // Future archetypes can be added here
};

// Utility to get screens for an archetype, always returns at least core screens
export function getScreensForArchetype(archetypeKey: string): string[] {
    return ARCHETYPE_SCREEN_ACCESS[archetypeKey] || [
        ...CORE_CONTINUITY_SCREENS,
        'Opportunities',
        'QuoteRequestsDashboard',
        'InventoryLedger',
        'GivingSupport',
        'ContentGenerator',
        'DocumentComposer',
    ];
}
