import { ReconciliationRecord } from './reconciliationEngine';
import { StewardCondition, StewardSignals } from './stewardStateRegistry';

/**
 * Layer 17 - Council Session Record
 * A permanent memory artifact of a Council Gathering.
 */
export interface CouncilSessionRecord {
    id: string;
    stewardId: string;
    startedAt: Date;
    endedAt: Date;

    detectedNeed: string;
    activeRoleKey: string;
    activatedNodes: string[];

    signalsBefore: StewardSignals;
    signalsAfter: StewardSignals;

    conditionBefore: StewardCondition;
    conditionAfter: StewardCondition;

    witnessSummary: string;

    /**
     * Layer 18 - Reconciliation History
     * Tracks manual adjustments and Council re-evaluations.
     */
    reconciliationHistory?: ReconciliationRecord[];
}
