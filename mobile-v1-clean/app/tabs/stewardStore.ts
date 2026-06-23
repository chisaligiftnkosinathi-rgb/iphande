import { InfluenceStore } from './influenceStore';
import { StewardSignals } from './stewardStateRegistry';

// Mock in-memory store for StewardSignals
const stewardSignalsStore: Map<string, StewardSignals> = new Map();

export class StewardStore {
    public static getSignals(stewardId: string): StewardSignals {
        // Return a deep copy to prevent direct mutation outside the store
        const baseSignals = { ...stewardSignalsStore.get(stewardId) } || {
            provisionScore: 0.5,
            tradeScore: 0.5,
            trustScore: 0.5,
            memoryScore: 0.5,
            growthScore: 0.5,
            financeScore: 0.5,
        };

        // Apply influence buffers to derive effective signals
        const buffers = InfluenceStore.getAll(stewardId);
        const effectiveSignals = { ...baseSignals };
        for (const buffer of buffers) {
            effectiveSignals[buffer.field] = Math.max(0, Math.min(1, effectiveSignals[buffer.field] + InfluenceStore.applyDecay(buffer)));
        }

        return effectiveSignals;
    }

    public static updateSignals(stewardId: string, signals: StewardSignals): void {
        stewardSignalsStore.set(stewardId, { ...signals });
    }
}
