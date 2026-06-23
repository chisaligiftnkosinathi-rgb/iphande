// apps/api/src/tests/sanas_constitution_v2/constitutionComparator.ts

import { SimulationResult } from "./constitutionSimulator";

export class ConstitutionComparator {
    compare(v1: SimulationResult, v2: SimulationResult) {
        return {
            acceptedDelta: v2.accepted.length - v1.accepted.length,
            rejectedDelta: v2.rejected.length - v1.rejected.length,

            stabilityScore:
                v2.accepted.length /
                Math.max(1, v1.accepted.length + v1.rejected.length),

            riskIncrease: v2.rejected.length > v1.rejected.length,
        };
    }
}
