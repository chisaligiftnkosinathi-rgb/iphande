/**
 * iPhande Layout Rhythm System
 *
 * Doctrine: The steward must never feel rushed.
 * Generous spacing, readable cards, breathing room, deliberate transitions.
 */

import { colors } from './colors';

export const layout = {
    spacing: {
        xs: 4,
        sm: 8,
        md: 12,
        lg: 16,
        xl: 20,
        xxl: 24,
        xxxl: 32,
        huge: 48,
    },
    radii: {
        sm: 8,
        md: 12,
        lg: 16,
        xl: 20,
        xxl: 24,
        pill: 999,
    },
    cards: {
        base: {
            backgroundColor: colors.humanSpace.surface,
            borderRadius: 20,
            padding: 20,
            borderWidth: 1,
            borderColor: colors.structural.border,
            marginBottom: 16,
        },
    },
};

export default layout;
