import { ReconciliationOutcome } from './reconciliationEngine';
import { StewardSignals } from './stewardStateRegistry';

/**
 * Layer 19 - Council Adjustment Event
 * The atomic unit of causal propagation from reconciliation.
 */
export interface CouncilAdjustmentEvent {
    id: string;
    sessionId: string;
    stewardId: string;
    timestamp: Date;
    affectedField: keyof StewardSignals;
    originalValue: any;
    reconciledValue: any;
    adjustmentStrength: number; // 0–1 how strongly future inference should shift
    outcome: ReconciliationOutcome;
    source: "reconciliation_layer";
}
