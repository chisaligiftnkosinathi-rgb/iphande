import { RuleResult, TruthConstitution } from './TruthConstitution';

export interface SimulationResult {
    accepted: { event: any; decision: RuleResult }[];
    rejected: { event: any; decision: RuleResult }[];
}

export class ConstitutionSimulator {
    run(
        constitution: TruthConstitution,
        events: any[],
        contextFactory: (event: any) => any = (event) => ({})
    ): SimulationResult {
        const accepted: { event: any; decision: RuleResult }[] = [];
        const rejected: { event: any; decision: RuleResult }[] = [];

        for (const event of events) {
            const context = contextFactory(event);
            const decision = constitution.evaluate(event, context);

            if (decision.allowed) { accepted.push({ event, decision }); } else { rejected.push({ event, decision }); }
        }
        return { accepted, rejected };
    }
}

export const simulator = new ConstitutionSimulator();
