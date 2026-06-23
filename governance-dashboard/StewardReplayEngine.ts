import { LedgerEvent } from '../ledger/TruthLedger';

export interface StewardState {
    stewardId: string;
    totalSignals: number;
    lastSignalValue: number;
    calibrationBand: string;
    narrativeCount: number;
    lastActive: number;
}

export class StewardReplayEngine {
    /**
     * Reconstructs the exact state of a steward by replaying their history.
     * This is the "Verification of Truth" cycle.
     */
    reconstruct(stewardId: string, events: LedgerEvent[]): StewardState {
        const state: StewardState = {
            stewardId,
            totalSignals: 0,
            lastSignalValue: 0,
            calibrationBand: 'LOW',
            narrativeCount: 0,
            lastActive: 0,
        };

        const stewardEvents = events
            .filter((e) => e.stewardId === stewardId)
            .sort((a, b) => a.sequence - b.sequence); // Reality must be replayed in sequence order

        for (const event of stewardEvents) {
            this.applyEvent(state, event);
        }

        return state;
    }

    private applyEvent(state: StewardState, event: LedgerEvent): void {
        state.lastActive = event.timestamp;

        switch (event.type) {
            case 'SIGNAL_INGESTED':
                state.totalSignals++;
                state.lastSignalValue = event.payload.signal;
                break;
            case 'CALIBRATION_APPLIED':
                state.calibrationBand = event.payload.band;
                break;
            case 'NARRATIVE_EMITTED':
                state.narrativeCount++;
                break;
            default:
                // Log or track unrecognized events that don't impact the core state
                console.warn(`Unrecognized event type in replay: ${event.type}`);
        }
    }
}
