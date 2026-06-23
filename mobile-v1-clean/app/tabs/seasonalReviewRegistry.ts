import { StewardSignals } from './stewardStateRegistry';

/**
 * Layer 22 — Seasonal Stewardship Review
 */
export interface CalibrationRecommendation {
    area: string;
    reason: string;
    severity: "low" | "medium" | "high";
    suggestedAction: string;
}

export interface SeasonalStewardshipReview {
    id: string;
    stewardId: string;
    periodStart: Date;
    periodEnd: Date;
    sessionsReviewed: number;
    averageSignals: StewardSignals;
    effectiveSignals: StewardSignals;
    reconciliationCount: number;
    acceptedAdjustments: number;
    partialAdjustments: number;
    rejectedAdjustments: number;
    /** RSI = acceptedAdjustments / (accepted + partial + rejected) */
    reconciliationStabilityIndex: number;
    recurringThemes: string[];
    councilObservations: string[];
    stewardshipNarrative: string;
    calibrationRecommendations: CalibrationRecommendation[];
    generatedAt: Date;
}
