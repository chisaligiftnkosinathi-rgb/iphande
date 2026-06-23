// apps/api/src/tests/sanas/stewardReplayEngine.ts

import { TruthLedger } from "./truthLedger";

export interface StewardState {
    stewardId: string;
    signals: number;
    reconciliations: number;
    calibrationBands: string[];
}

export class StewardReplayEngine {
    constructor(private ledger: TruthLedger) { }

    replay(stewardId: string): StewardState {
        const events = this.ledger.getBySteward(stewardId);

        const state: StewardState = {
            stewardId,
            signals: 0,
            reconciliations: 0,
            calibrationBands: [],
        };

        for (const e of events) {
            switch (e.type) {
                case "SIGNAL_INGESTED":
                    state.signals += e.payload.amount;
                    break;

                case "RECONCILIATION_RUN":
                    state.reconciliations += 1;
                    break;

                case "CALIBRATION_APPLIED":
                    state.calibrationBands.push(e.payload.band);
                    break;
            }
        }

        return state;
    }
}
