// Governed dictionary of semantic document building blocks.
// Prevents section sprawl and enforces strict mutability constraints for compliance.

export type SectionSemanticFamily =
    | 'identity_section'
    | 'disclosure_section'
    | 'pricing_section'
    | 'traceability_section'
    | 'reflection_section'
    | 'evidence_section'
    | 'continuity_section'
    | 'interpretation_section'
    | 'signature_section';

export type SectionMutability =
    | 'mutable'           // Steward can freely edit or remove in draft
    | 'readonly'          // Visible to steward, cannot be edited, but could be excluded if template allows
    | 'immutable'         // Cannot be edited, removed, or suppressed by steward or template
    | 'system_generated'  // Filled entirely by backend logic (e.g., Replay IDs)
    | 'standard_mandated'; // Forced into inclusion by an active standard, steward must fulfill it

export interface TemplateSection {
    sectionKey: string;
    sectionLabel: string;
    semanticFamily: SectionSemanticFamily;
    mutability: SectionMutability;
    description: string;
}

export const TEMPLATE_SECTION_REGISTRY: TemplateSection[] = [
    {
        sectionKey: 'SEC-ID-001',
        sectionLabel: 'Steward Context',
        semanticFamily: 'identity_section',
        mutability: 'readonly',
        description: 'Governed identity derived directly from the business profile.'
    },
    {
        sectionKey: 'SEC-DISC-001',
        sectionLabel: 'Standard Disclosure Notice',
        semanticFamily: 'disclosure_section',
        mutability: 'immutable',
        description: 'Mandatory footer injected by operational standards protecting against false authority.'
    },
    {
        sectionKey: 'SEC-PRICE-001',
        sectionLabel: 'Proposed Cost Breakdown',
        semanticFamily: 'pricing_section',
        mutability: 'mutable',
        description: 'Detailed proposal of value exchange, editable by the steward.'
    },
    {
        sectionKey: 'SEC-TRACE-001',
        sectionLabel: 'Ingredient / Materials Sourcing',
        semanticFamily: 'traceability_section',
        mutability: 'standard_mandated',
        description: 'Tracks origin of inputs. Required for food or industrial continuity templates.'
    },
    {
        sectionKey: 'SEC-REFL-001',
        sectionLabel: 'Steward Reflection',
        semanticFamily: 'reflection_section',
        mutability: 'mutable',
        description: 'Captures teaching, pastoral notes, or operational wisdom.'
    },
    {
        sectionKey: 'SEC-EVID-001',
        sectionLabel: 'Visual Evidence Matrix',
        semanticFamily: 'evidence_section',
        mutability: 'mutable',
        description: 'Provides before/after or physical proof attached to the document.'
    },
    {
        sectionKey: 'SEC-CONT-001',
        sectionLabel: 'Replay Lineage Block',
        semanticFamily: 'continuity_section',
        mutability: 'system_generated',
        description: 'Automatically renders the parent_event_id and timeline hashes anchoring the document to reality.'
    },
    {
        sectionKey: 'SEC-INT-001',
        sectionLabel: 'Bounded Interpretation',
        semanticFamily: 'interpretation_section',
        mutability: 'mutable',
        description: 'The steward’s meaning applied to facts (e.g., Claim Guidance, Sampling Outcome).'
    },
    {
        sectionKey: 'SEC-SIG-001',
        sectionLabel: 'Steward Commitment Sign-off',
        semanticFamily: 'signature_section',
        mutability: 'mutable',
        description: 'Human intent to proceed, anchoring the document to a specific steward session.'
    }
];
