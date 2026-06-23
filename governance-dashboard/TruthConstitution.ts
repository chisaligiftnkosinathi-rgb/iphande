export type RuleCategory = 'EPISTEMIC' | 'ETHICAL' | 'GOVERNANCE' | 'INTEGRITY';

export interface RuleResult {
    allowed: boolean;
    reason?: string;
    ruleId: string;
}

export interface ConstitutionRule {
    id: string;
    category: RuleCategory;
    description: string;
    evaluate: (event: any, context: any) => Omit<RuleResult, 'ruleId'>;
}

export class TruthConstitution {
    private rules: ConstitutionRule[] = [];

    constructor(public readonly version: string) { }

    /**
     * Registers a rule to the constitution.
     * Rules are evaluated in the order they are registered.
     */
    register(rule: ConstitutionRule): void {
        this.rules.push(rule);
    }

    /**
     * The core decisioning logic.
     * Evaluates a signal against all registered constitutional rules.
     */
    evaluate(event: any, context: any = {}): RuleResult {
        for (const rule of this.rules) {
            const result = rule.evaluate(event, context);
            if (!result.allowed) {
                return {
                    allowed: false,
                    reason: result.reason,
                    ruleId: rule.id,
                };
            }
        }
        return { allowed: true, ruleId: 'all-clear' };
    }

    getRules(): ConstitutionRule[] {
        return [...this.rules];
    }
}
