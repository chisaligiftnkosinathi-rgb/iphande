import { SimulationResult } from './ConstitutionSimulator';

export interface ComparisonResult {
    acceptedDelta: number;
    rejectedDelta: number;
    stabilityScore: number;
    riskIncrease: boolean;
}

export class ConstitutionComparator {
    compare(v1: SimulationResult, v2: SimulationResult): ComparisonResult {
        const totalEventsV1 = v1.accepted.length + v1.rejected.length;
        const totalEventsV2 = v2.accepted.length + v2.rejected.length;

        return {
            acceptedDelta: v2.accepted.length - v1.accepted.length,
            rejectedDelta: v2.rejected.length - v1.rejected.length,
            stabilityScore: totalEventsV1 > 0 ? v2.accepted.length / totalEventsV1 : 0,
            riskIncrease: v2.rejected.length > v1.rejected.length,
        };
    }
}

export const comparator = new ConstitutionComparator();
