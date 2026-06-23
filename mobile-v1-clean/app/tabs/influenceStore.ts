import { StewardSignals } from './stewardStateRegistry';

/**
 * Layer 20 - Signal Influence Buffer
 * A shadow layer that biases future signal calculations.
 */
export interface SignalInfluenceBuffer {
    field: keyof StewardSignals;
    biasDelta: number;
    decayRate: number; // how quickly correction fades
    lastUpdated: Date;
}

// In-memory store for demonstration purposes
const influenceBuffers: Map<string, Map<keyof StewardSignals, SignalInfluenceBuffer>> = new Map();

export class InfluenceStore {
    public static get(stewardId: string, field: keyof StewardSignals): SignalInfluenceBuffer | undefined {
        return influenceBuffers.get(stewardId)?.get(field);
    }

    public static set(stewardId: string, field: keyof StewardSignals, buffer: SignalInfluenceBuffer): void {
        if (!influenceBuffers.has(stewardId)) {
            influenceBuffers.set(stewardId, new Map());
        }
        influenceBuffers.get(stewardId)?.set(field, buffer);
    }

    public static getAll(stewardId: string): SignalInfluenceBuffer[] {
        return Array.from(influenceBuffers.get(stewardId)?.values() || []);
    }

    /**
     * Helper function for decay calculation
     */
    public static daysSince(date: Date): number {
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    public static applyDecay(buffer: SignalInfluenceBuffer): number {
        const ageDays = this.daysSince(buffer.lastUpdated);
        return buffer.biasDelta * Math.exp(-buffer.decayRate * ageDays);
    }
}
