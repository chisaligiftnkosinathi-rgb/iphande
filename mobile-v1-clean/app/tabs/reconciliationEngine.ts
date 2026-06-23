import { CouncilAdjustmentEvent } from './councilEvents';
import { InfluenceStore } from './influenceStore';
import { LedgerEventBus } from './ledgerEventBus';
import { StewardSignals } from './stewardStateRegistry';

/**
 * Layer 18 - Reconciliation Intent
 * Captures a steward's request to adjust a Council observation.
 */
export interface ReconciliationIntent {
    sessionId: string;
    stewardId: string;

    targetType: "signal" | "condition" | "witnessSummary";
    targetField: string; // e.g. "provisionScore" or "state"

    currentSystemValue: any;
    proposedValue: any;

    justification: string;
    confidence: "low" | "medium" | "high";
}

export type ReconciliationOutcome = "accepted" | "partial" | "rejected";

/**
 * A permanent record of an adjustment event.
 */
export interface ReconciliationRecord {
    id: string;
    sessionId: string;
    intent: ReconciliationIntent;
    outcome: ReconciliationOutcome;
    councilReasoning: string;
    reconciledValue: any;
    timestamp: Date;
}

export interface ReconciledSessionView {
    originalSignals: StewardSignals;
    reconciledSignals: StewardSignals;
    deltaExplanation: string[];
    acceptedAdjustments: string[];
    rejectedAdjustments: string[];
}

// Helper function for computing days since a date (moved to InfluenceStore)

export class ReconciliationEngine {
    /**
     * Evaluates a ReconciliationIntent against Council rules.
     * This is the bridge between Human Meaning and System Structure.
     */
    public static evaluateIntent(
        intent: ReconciliationIntent,
        currentSignals: StewardSignals
    ): ReconciliationRecord {

        let outcome: ReconciliationOutcome = "rejected";
        let reasoning = "Adjustment rejected: insufficient justification for structural shift.";
        let reconciledValue = intent.currentSystemValue;
        const adjustmentStrength = 0.5; // Default strength, could be dynamic based on confidence/impact

        // 1. Validation Logic (The Council's Pushback)
        // Rule: A justification must be provided.
        if (intent.justification.trim().length > 10) {
            if (intent.targetType === "signal" && typeof intent.proposedValue === "number") {
                const delta = Math.abs(intent.proposedValue - (intent.currentSystemValue as number));

                // Rule: Signals cannot move more than 0.2 without 'High' confidence
                if (delta <= 0.1 || (delta <= 0.2 && intent.confidence === "high")) {
                    outcome = "accepted";
                    reasoning = "Steward clarification accepted. Structural signal recalibrated.";
                    reconciledValue = intent.proposedValue;
                } else {
                    outcome = "partial";
                    reconciledValue = (intent.proposedValue + (intent.currentSystemValue as number)) / 2;
                    reasoning = "Council acknowledges discrepancy but maintains structural baseline. Adjusted to median.";
                }
            }
        }

        const record: ReconciliationRecord = {
            id: `adj_${Math.random().toString(36).substring(2, 11)}`,
            sessionId: intent.sessionId,
            intent,
            outcome,
            councilReasoning: reasoning,
            reconciledValue,
            timestamp: new Date(),
        };

        // Trigger background event hooks for causal propagation (Layer 21 - Ledger Propagation System)
        this.onReconciliationFinalized({
            id: `cae_${Math.random().toString(36).substring(2, 11)}`,
            sessionId: record.sessionId,
            stewardId: record.stewardId,
            timestamp: record.timestamp,
            affectedField: record.intent.targetField as keyof StewardSignals,
            originalValue: record.intent.currentSystemValue,
            reconciledValue: record.reconciledValue,
            adjustmentStrength: adjustmentStrength,
            outcome: record.outcome,
            source: "reconciliation_layer",
        });

        return record;
    }

    /**
     * Layer 21 - Ledger Propagation System
     * Background event hooks that trigger when a reconciliation is finalized.
     */
    private static onReconciliationFinalized(event: CouncilAdjustmentEvent): void {
        LedgerEventBus.emit("COUNCIL_ADJUSTMENT_APPLIED", event);
        this.updateInfluenceBuffer(event);
        // Recompute forecast weights is handled by the StewardStore when signals are retrieved
        // to ensure the latest buffers are applied.
        // persistAdjustmentTrace(event); // ReconciliationRecord is already persisted via CouncilSessionRegistry
    }

    /**
     * Hook 1: Update Influence Buffer
     * This is where “human correction becomes future signal gravity.”
     */
    private static updateInfluenceBuffer(event: CouncilAdjustmentEvent): void {
        const newBias = event.adjustmentStrength * (event.reconciledValue - event.originalValue);

        InfluenceStore.set(event.stewardId, event.affectedField, {
            field: event.affectedField,
            biasDelta: newBias,
            decayRate: 0.02, // Example decay rate
            lastUpdated: new Date(),
        });
    }
}

export function computeSessionView(
    originalSignals: StewardSignals,
    records: ReconciliationRecord[]
): ReconciledSessionView {
    const reconciledSignals = { ...originalSignals };
    const acceptedAdjustments: string[] = [];
    const rejectedAdjustments: string[] = [];
    const deltaExplanation: string[] = [];

    for (const record of records) {
        const field = record.intent.targetField as keyof StewardSignals;
        if (record.outcome === "accepted" || record.outcome === "partial") {
            const oldVal = originalSignals[field];
            reconciledSignals[field] = record.reconciledValue;

            acceptedAdjustments.push(field);
            deltaExplanation.push(
                `Recalibrated ${field} from ${oldVal} to ${record.reconciledValue} (${record.outcome}). Reason: ${record.councilReasoning}`
            );
        } else {
            rejectedAdjustments.push(field);
        }
    }

    return {
        originalSignals,
        reconciledSignals,
        deltaExplanation,
        acceptedAdjustments,
        rejectedAdjustments
    };
}
}
