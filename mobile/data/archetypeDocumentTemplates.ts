// Governed registry of archetype-specific document templates for iPhande
// Enforces structured, replay-aware, and governance-aware long-form continuity generation.

export type DocumentVisibility = 'public' | 'steward_only' | 'lineage_restricted';
export type ReplayBindingMode = 'append_only' | 'lineage_linked';

export interface ArchetypeDocumentTemplate {
    templateKey: string;
    archetypeKey: string;
    documentType: string;
    titlePattern: string;
    sections: string[];
    visibilityDefault: DocumentVisibility;
    replayBindingMode: ReplayBindingMode;
    governanceBoundary: string;
}

export const ARCHETYPE_DOCUMENT_TEMPLATES: ArchetypeDocumentTemplate[] = [
    // --- MINISTRY & COMMUNITY STEWARD ---
    {
        templateKey: 'TPL-MIN-001',
        archetypeKey: 'community_ministry_steward',
        documentType: 'ministry_teaching',
        titlePattern: 'Teaching Scroll - {Title}',
        sections: [
            'Title',
            'Scripture Foundation',
            'Teaching Body',
            'Reflection',
            'Prayer',
            'Continuity Notes'
        ],
        visibilityDefault: 'public',
        replayBindingMode: 'append_only',
        governanceBoundary: 'Teaching preserves declared interpretation. It does not manufacture spiritual authority.'
    },

    // --- FINANCIAL & INSURANCE STEWARD (Funeral Cover) ---
    {
        templateKey: 'TPL-FIN-001',
        archetypeKey: 'financial_insurance_steward',
        documentType: 'business_proposal',
        titlePattern: 'Family Cover Proposal - {ClientName}',
        sections: [
            'Client Details',
            'Proposed Cover',
            'Terms Overview',
            'Steward Commitment',
            'Next Steps'
        ],
        visibilityDefault: 'lineage_restricted',
        replayBindingMode: 'lineage_linked',
        governanceBoundary: 'Proposal reflects declared offering. It does not guarantee outcome or final underwriter approval.'
    },

    // --- LOCAL RETAIL STEWARD ---
    {
        templateKey: 'TPL-RET-001',
        archetypeKey: 'local_retail_steward',
        documentType: 'catalogue',
        titlePattern: 'Specials Catalogue - {Month}',
        sections: [
            'Store Context',
            'Current Specials',
            'Standard Items',
            'Operating Hours',
            'Contact Information'
        ],
        visibilityDefault: 'public',
        replayBindingMode: 'append_only',
        governanceBoundary: 'Catalogue declares current availability. It does not guarantee future stock or indefinite pricing.'
    },

    // --- EDUCATION & TUTORING STEWARD ---
    {
        templateKey: 'TPL-EDU-001',
        archetypeKey: 'education_tutoring_steward',
        documentType: 'study_guide',
        titlePattern: 'Learning Guide - {Topic}',
        sections: [
            'Topic Overview',
            'Core Concepts',
            'Practice Exercises',
            'Review Questions',
            'Tutor Notes'
        ],
        visibilityDefault: 'public',
        replayBindingMode: 'append_only',
        governanceBoundary: 'Guide provides structured knowledge. It does not guarantee academic results or official accreditation.'
    },

    // --- CREATIVE & MEDIA STEWARD ---
    {
        templateKey: 'TPL-CRE-001',
        archetypeKey: 'creative_media_steward',
        documentType: 'portfolio_scroll',
        titlePattern: 'Portfolio Scroll - {ProjectName}',
        sections: [
            'Project Context',
            'Media Showcase',
            'Steward Role',
            'Client Outcome',
            'Contact for Booking'
        ],
        visibilityDefault: 'public',
        replayBindingMode: 'append_only',
        governanceBoundary: 'Portfolio presents past continuity. It does not predict exact future deliverables.'
    }
];
