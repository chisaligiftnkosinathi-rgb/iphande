import { CouncilSessionRecord } from './councilSessionRegistry';
import { InfluenceStore } from './influenceStore';
import { ReconciliationRecord } from './reconciliationEngine';
import { CalibrationRecommendation, SeasonalStewardshipReview } from './seasonalReviewRegistry';
import { StewardSignals } from './stewardStateRegistry';

export class SeasonalReviewEngine {
    /**
     * Synthesizes a season of data into a Stewardship Review.
     */
    public static generateReview(
        stewardId: string,
        records: ReconciliationRecord[],
        history: CouncilSessionRecord[],
        start: Date,
        end: Date
    ): SeasonalStewardshipReview {
        const accepted = records.filter(r => r.outcome === "accepted").length;
        const partial = records.filter(r => r.outcome === "partial").length;
        const rejected = records.filter(r => r.outcome === "rejected").length;
        const total = records.length;

        const rsi = total > 0 ? accepted / total : 1.0;
        const averageSignals = this.calculateAverageSignals(records);

        return {
            id: `rev_${Math.random().toString(36).substring(2, 11)}`,
            stewardId,
            periodStart: start,
            periodEnd: end,
            sessionsReviewed: records.length,
            averageSignals,
            effectiveSignals: this.calculateEffectiveSignalsForReview(stewardId, averageSignals, end), // Derived with influence buffers
            reconciliationCount: total,
            acceptedAdjustments: accepted,
            partialAdjustments: partial,
            rejectedAdjustments: rejected,
            reconciliationStabilityIndex: rsi,
            recurringThemes: this.detectThemes(rsi, records),
            councilObservations: this.generateObservations(rsi, total, records),
            stewardshipNarrative: this.generateNarrative(rsi, records, effectiveSignals), // Pass effectiveSignals to narrative
            calibrationRecommendations: this.generateRecommendations(records),
            generatedAt: new Date()
        };
    }

    private static calculateAverageSignals(records: ReconciliationRecord[]): StewardSignals {
        // In a full implementation, this aggregates signal snapshots across the season
        return { provisionScore: 0.5, tradeScore: 0.5, trustScore: 0.5, memoryScore: 0.5, growthScore: 0.5, financeScore: 0.5 };
    }

    private static detectThemes(rsi: number, records: ReconciliationRecord[]): string[] {
        const themes: string[] = [];
        if (rsi < 0.5) themes.push("Calibration Drift");
        if (rsi > 0.8) themes.push("Structural Alignment");

        const provisionAdjustments = records.filter(r => r.intent.targetField === "provisionScore").length;
        if (provisionAdjustments > records.length * 0.4) {
            themes.push("Lived Experience Mismatch: Provision");
        }

        return themes.length > 0 ? themes : ["Baseline Stability"];
    }

    private static generateObservations(rsi: number, total: number, records: ReconciliationRecord[]): string[] {
        const obs = [`Reconciliation Stability Index is ${rsi.toFixed(2)}.`];

        if (rsi < 0.5) {
            obs.push("Council is repeatedly misunderstanding lived experience. Significant drift detected.");
        } else if (rsi < 0.8) {
            obs.push("Moderate calibration drift observed.");
        } else {
            obs.push("Council assessments generally aligned with steward reality.");
        }

        const provisionAdjustments = records.filter(r => r.intent.targetField === "provisionScore" && r.outcome === "accepted").length;
        if (provisionAdjustments > 2) {
            obs.push(`Provision assessments required reconciliation in ${((provisionAdjustments / total) * 100).toFixed(0)}% of cases.`);
        }

        return obs;
    }

    private static generateNarrative(rsi: number, records: ReconciliationRecord[], signals: StewardSignals): string {
        const primaryTone = signals.provisionScore < 0.4 ? "resilient" : "flourishing";
        return `During this season, the steward maintained a steady Reconciliation Stability Index of ${rsi.toFixed(2)}. ` +
            `Reconciliation activity revealed specific instances where automated assessments for Provision diverged from the steward's lived reality. ` +
            `The steward demonstrated a ${primaryTone} lifestyle pattern. ` +
            `While interpretive drift exists, the foundational integrity of the stewardship remains high.`;
    }

    private static generateRecommendations(records: ReconciliationRecord[]): CalibrationRecommendation[] {
        const recommendations: CalibrationRecommendation[] = [];
        const provisionAccepted = records.filter(r => r.intent.targetField === "provisionScore" && r.outcome === "accepted");

        if (provisionAccepted.length > 3) {
            recommendations.push({
                area: "Provision Signal Weighting",
                reason: "Repeated steward corrections indicate over-sensitive crisis detection in automated assessments.",
                severity: "medium",
                suggestedAction: "Reduce the provision distress multiplier from 0.35 to 0.25 in LedgerEngine logic."
            });
        }

        return recommendations.length > 0 ? recommendations : [{
            area: "General Calibration",
            reason: "No high-frequency drift patterns detected.",
            severity: "low",
            suggestedAction: "Maintain current weighting baseline."
        }];
    }

    private static calculateEffectiveSignalsForReview(stewardId: string, baseSignals: StewardSignals, endDate: Date): StewardSignals {
        const effectiveSignals = { ...baseSignals };
        const buffers = InfluenceStore.getAll(stewardId);

        for (const buffer of buffers) {
            // For a historical review, we'd need to calculate decay based on endDate and buffer.lastUpdated.
            // For this consolidation, we'll apply the current decayed bias.
            // A more robust solution would involve passing a historical snapshot of InfluenceStore.
            effectiveSignals[buffer.field] = Math.max(0, Math.min(1, effectiveSignals[buffer.field] + InfluenceStore.applyDecay(buffer)));
        }
        return effectiveSignals;
    }
}
