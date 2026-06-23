// apps/api/src/tests/sanas_constitution_v2/constitutionSimulator.ts

import { TruthConstitutionV1 } from "../sanas_constitution/truthConstitutionV1";

export interface SimulationResult {
    accepted: any[];
    rejected: any[];
}

export class ConstitutionSimulator {
    run(
        constitution: TruthConstitutionV1,
        events: any[],
        contextFactory: (event: any) => any
    ): SimulationResult {
        const accepted: any[] = [];
        const rejected: any[] = [];

        for (const event of events) {
            const context = contextFactory(event);
            const decision = constitution.evaluate(event, context);

            if (decision.allowed) {
                accepted.push(event);
            } else {
                rejected.push({
                    event,
                    reason: decision.reason,
                    ruleId: decision.ruleId,
                });
            }
        }
        return { accepted, rejected };
    }
}
