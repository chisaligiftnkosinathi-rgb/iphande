// Governed registry of business/economic archetypes for iPhande
// Each archetype encodes constitutional identity, continuity, and operational metadata

export interface BusinessArchetype {
    key: string;
    label: string;
    description: string;
    examples: string[];
    core_continuity: string[];
}

export const BUSINESS_ARCHETYPES: BusinessArchetype[] = [
    {
        key: 'local_retail_steward',
        label: 'Local Retail Steward',
        description: 'Shops and resellers serving local communities.',
        examples: ['spaza shop', 'local store', 'clothing seller', 'tuckshop', 'reseller'],
        core_continuity: ['stock', 'specials', 'repeat customers', 'visibility'],
    },
    {
        key: 'beauty_wellness_steward',
        label: 'Beauty & Wellness Steward',
        description: 'Hair, beauty, and wellness services.',
        examples: ['hair salon', 'barber', 'nail technician', 'makeup artist', 'spa'],
        core_continuity: ['appointments', 'repeat clients', 'media visibility'],
    },
    {
        key: 'food_catering_steward',
        label: 'Food & Catering Steward',
        description: 'Food, catering, and takeaway businesses.',
        examples: ['kota business', 'catering', 'bakery', 'food stand', 'takeaway'],
        core_continuity: ['daily offers', 'availability', 'ordering'],
    },
    {
        key: 'skilled_trades_steward',
        label: 'Skilled Trades Steward',
        description: 'Trades and repair services.',
        examples: ['electrician', 'plumber', 'builder', 'welder', 'mechanic'],
        core_continuity: ['jobs', 'quotes', 'trust', 'availability'],
    },
    {
        key: 'transport_delivery_steward',
        label: 'Transport & Delivery Steward',
        description: 'Transport and delivery services.',
        examples: ['taxi', 'shuttle', 'courier', 'moving services'],
        core_continuity: ['routes', 'availability', 'coordination'],
    },
    {
        key: 'property_housing_steward',
        label: 'Property & Housing Steward',
        description: 'Property, rentals, and accommodation.',
        examples: ['real estate', 'rentals', 'accommodation', 'agents'],
        core_continuity: ['listings', 'inquiries', 'follow-ups'],
    },
    {
        key: 'financial_insurance_steward',
        label: 'Financial & Insurance Steward',
        description: 'Financial and insurance services.',
        examples: ['funeral cover', 'insurance agent', 'broker', 'financial services'],
        core_continuity: ['relationships', 'quotes', 'trust', 'follow-up continuity'],
    },
    {
        key: 'education_tutoring_steward',
        label: 'Education & Tutoring Steward',
        description: 'Tutoring, training, and coaching.',
        examples: ['tutor', 'training', 'skills coaching'],
        core_continuity: ['bookings', 'learners', 'scheduling'],
    },
    {
        key: 'creative_media_steward',
        label: 'Creative & Media Steward',
        description: 'Creative and media professionals.',
        examples: ['photographer', 'designer', 'musician', 'videographer'],
        core_continuity: ['portfolio', 'media continuity', 'client visibility'],
    },
    {
        key: 'community_ministry_steward',
        label: 'Community & Ministry Steward',
        description: 'Community and ministry organizations.',
        examples: ['churches', 'NGOs', 'youth programs', 'community groups'],
        core_continuity: ['events', 'announcements', 'community memory'],
    },
    {
        key: 'agriculture_farming_steward',
        label: 'Agriculture & Farming Steward',
        description: 'Farming and produce businesses.',
        examples: ['local farms', 'produce sellers', 'livestock'],
        core_continuity: ['seasonality', 'supply', 'community trade'],
    },
    {
        key: 'health_care_steward',
        label: 'Health & Care Steward',
        description: 'Health, care, and wellness support.',
        examples: ['caregivers', 'clinics', 'wellness support'],
        core_continuity: ['trust', 'availability', 'care continuity'],
    },
    {
        key: 'tech_digital_services',
        label: 'Technology & Digital Services Steward',
        description: 'Simplifying digital complexity, building systems, and keeping communities connected.',
        examples: ['app development', 'website design', 'it support', 'tech consulting'],
        core_continuity: ['projects', 'client relationships', 'system continuity', 'support tickets'],
    },
];
