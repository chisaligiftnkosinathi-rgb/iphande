import { CouncilSessionRecord } from './councilSessionRegistry';
import { LifestyleCategory, StewardLifestylePattern } from './lifestyleRegistry';
import { SeasonalStewardshipReview } from './seasonalReviewRegistry';

export class LifestyleEngine {
    /**
     * Derives lifestyle patterns by analyzing a review and historical sessions.
     */
    public static derivePatterns(
        review: SeasonalStewardshipReview,
        history: CouncilSessionRecord[]
    ): StewardLifestylePattern[] {
        const patterns: StewardLifestylePattern[] = [];

        // Example Derived Pattern: Consistent Provision Pressure
        const provisionIssues = history.filter(s => s.activatedNodes.includes("provision")).length;
        if (provisionIssues > history.length * 0.5) {
            patterns.push(this.createPattern(
                review.stewardId,
                "provision",
                "Recurring household provision pressure",
                provisionIssues,
                review.effectiveSignals.provisionScore - review.averageSignals.provisionScore,
                0.85
            ));
        }

        // Example Derived Pattern: Trust through Evidence
        const highTrustSessions = history.filter(s => s.signalsAfter.trustScore > 0.8).length;
        if (highTrustSessions > 0) {
            patterns.push(this.createPattern(
                review.stewardId,
                "trust",
                "High integrity evidence submission",
                highTrustSessions,
                0.15, // Estimated impact
                0.92
            ));
        }

        return patterns;
    }

    private static createPattern(
        stewardId: string,
        category: LifestyleCategory,
        pattern: string,
        frequency: number,
        impact: number,
        confidence: number
    ): StewardLifestylePattern {
        return {
            id: `lp_${Math.random().toString(36).substring(2, 11)}`,
            stewardId,
            category,
            pattern,
            frequency,
            observedImpact: impact,
            confidence,
            firstObserved: new Date(), // Simplified for prototype
            lastObserved: new Date()
        };
    }
}
