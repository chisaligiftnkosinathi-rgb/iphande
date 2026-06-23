/**
 * iPhande Typography Constitution
 *
 * Doctrine: Typography must slow the steward down enough to think clearly.
 *
 * Display -> profound moments
 * Heading -> section truth
 * Body -> calm readability
 * Caption -> bounded metadata
 * Evidence -> structured truth surfaces
 */

export const typography = {
    display: {
        fontSize: 34,
        fontWeight: '900' as const,
        letterSpacing: -1,
        lineHeight: 40,
    },
    title: {
        fontSize: 24,
        fontWeight: '800' as const,
        letterSpacing: -0.5,
        lineHeight: 32,
    },
    heading: {
        fontSize: 18,
        fontWeight: '700' as const,
        lineHeight: 26,
    },
    body: {
        fontSize: 15,
        fontWeight: '400' as const,
        lineHeight: 24,
    },
    bodyStrong: {
        fontSize: 15,
        fontWeight: '600' as const,
        lineHeight: 24,
    },
    caption: {
        fontSize: 13,
        fontWeight: '500' as const,
        lineHeight: 18,
    },
    evidence: {
        fontSize: 12,
        fontWeight: '700' as const,
        fontFamily: 'monospace', // Platform default monospace for structural data
        letterSpacing: 0.5,
        lineHeight: 18,
    },
    eyebrow: {
        fontSize: 12,
        fontWeight: '800' as const,
        textTransform: 'uppercase' as const,
        letterSpacing: 1.5,
        lineHeight: 16,
    },
};

export default typography;
