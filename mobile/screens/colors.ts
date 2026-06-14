/**
 * iPhande Color Meaning System
 * 
 * Doctrine: Every color carries semantic truth. No random colors.
 */

export const colors = {
    // Human Space: Warm, calm, readable backgrounds
    humanSpace: {
        background: '#F8FAF7', // Warm white
        surface: '#FFFFFF',    // Pure white for cards
    },

    // Structural Continuity: Grounded seriousness, un-manipulative
    structural: {
        charcoal: '#0F172A',
        charcoalLight: '#1E293B',
        slate: '#475569',
        slateMuted: '#64748b',
        border: '#E5E7EB',
        borderSoft: '#F3F4F6',
    },

    // Approved Stewardship: Intent finalized, successful execution
    stewardship: {
        bg: '#DCFCE7',
        text: '#16A34A',
        textDeep: '#15803D',
        border: '#BBF7D0',
    },

    // Reality / Caution / Humility: Bounded interpretations, warnings
    reality: {
        bg: '#FEF3C7',
        text: '#D97706',
        textDeep: '#92400E',
        border: '#FDE68A',
    },

    // Evidence Gaps / System Ops: Confessed uncertainty, system actions
    evidence: {
        bg: '#EFF6FF',
        text: '#2563EB',
        textDeep: '#1D4ED8',
        border: '#BFDBFE',
    },

    // Rejected / Unresolved: Human rejected intent, or critical failure
    resolution: {
        bg: '#FEF2F2',
        text: '#DC2626',
        textDeep: '#991B1B',
        border: '#FECACA',
    },

    // Wisdom / Annotation: Steward interpretations, reflections, teaching
    wisdom: {
        bg: '#F5F3FF',
        text: '#7C3AED',
        textDeep: '#5B21B6',
        border: '#DDD6FE',
    },
};

export default colors;
