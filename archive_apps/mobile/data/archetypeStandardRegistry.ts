// Governed registry of operational standards mapping to business archetypes
// Standards shape structure and inject disclosures, but do not manufacture authority.

export interface ArchetypeStandard {
    standardKey: string;
    standardName: string;
    applicableArchetypes: string[];
    operationalPurpose: string;
    templateInfluence: string;
    disclosureBoundary: string;
    verificationRequired: boolean;
}

export const ARCHETYPE_STANDARD_REGISTRY: ArchetypeStandard[] = [
    {
        standardKey: 'STD-FOOD-001',
        standardName: 'HACCP / ISO 22000 Operational Principles',
        applicableArchetypes: ['food_catering_steward', 'agriculture_farming_steward'],
        operationalPurpose: 'Food safety management, ingredient traceability, and safe handling structure.',
        templateInfluence: 'Mandates Preparation Context, Ingredient Traceability, and Storage Conditions sections.',
        disclosureBoundary: 'Structured with food continuity practices. This document does not constitute independent food safety certification.',
        verificationRequired: false,
    },
    {
        standardKey: 'STD-FIN-001',
        standardName: 'FAIS-Aligned Disclosure & POPIA Privacy Awareness',
        applicableArchetypes: ['financial_insurance_steward', 'property_housing_steward'],
        operationalPurpose: 'Ensures clear financial terms, risk disclosure, and client data protection.',
        templateInfluence: 'Injects Disclosure Notice, Cover Summary, and Risk Notes into proposals.',
        disclosureBoundary: 'Proposal reflects declared offering and structured disclosure. It does not guarantee outcome or final underwriter approval.',
        verificationRequired: false,
    },
    {
        standardKey: 'STD-MIN-001',
        standardName: 'Ethical Community Disclosure & Archival Continuity',
        applicableArchetypes: ['community_ministry_steward', 'education_tutoring_steward'],
        operationalPurpose: 'Preserves teaching lineage, pastoral accountability, and community memory.',
        templateInfluence: 'Shapes the Scripture Foundation, Reflection, and Continuity Notes sections.',
        disclosureBoundary: 'Teaching preserves declared interpretation. It does not manufacture absolute spiritual authority.',
        verificationRequired: false,
    },
    {
        standardKey: 'STD-RET-001',
        standardName: 'Basic Inventory Traceability (ISO 9001 Inspired)',
        applicableArchetypes: ['local_retail_steward'],
        operationalPurpose: 'Tracks supplier intake, stock velocity, and basic quality consistency.',
        templateInfluence: 'Injects Supplier Traceability and Stock Consistency into summaries.',
        disclosureBoundary: 'Structured using continuity-aligned operational practices. Not an ISO certified operation.',
        verificationRequired: false,
    },
    {
        standardKey: 'STD-IND-001',
        standardName: 'ISO 17025 / ISO 13909 Sampling & Custody Continuity',
        applicableArchetypes: ['skilled_trades_steward'],
        operationalPurpose: 'Maintains exact physical custody replay, sampling precision, and uncertainty mapping.',
        templateInfluence: 'Dictates Custody Replay, Sampling Methodology, and Bounded Interpretation sections.',
        disclosureBoundary: 'Report preserves physical custody chain and declared method. It does not replace independent accreditation.',
        verificationRequired: true,
    }
];
