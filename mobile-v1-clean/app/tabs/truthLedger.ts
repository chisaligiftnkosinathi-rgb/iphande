// apps/api/src/tests/sanas/truthLedger.ts

export type TruthEventType =
    | "STEWARD_CREATED"
    | "SIGNAL_INGESTED"
    | "RECONCILIATION_RUN"
    | "CALIBRATION_APPLIED"
    | "NARRATIVE_EMITTED"
    | "CROSS_STEWARD_INSIGHT"
    | "GOVERNANCE_DECISION";

export interface TruthEvent {
    id: string;
    stewardId: string;
    type: TruthEventType;
    timestamp: number;
    payload: any;
    version: number;
}

export class TruthLedger {
    private events: TruthEvent[] = [];

    append(event: TruthEvent) {
        this.events.push(Object.freeze(event));
    }

    getAll() {
        return [...this.events];
    }

    getBySteward(stewardId: string) {
        return this.events.filter(e => e.stewardId === stewardId);
    }

    getGlobal() {
        return this.events;
    }
}
