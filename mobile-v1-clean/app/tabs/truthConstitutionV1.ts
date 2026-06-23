// apps/api/src/tests/sanas_constitution/truthConstitutionV1.ts

export type ConstitutionDecision = {
    allowed: boolean;
    reason?: string;
    ruleId?: string;
};

export interface ConstitutionRule {
    id: string;
    category: "EPISTEMIC" | "ETHICAL" | "GOVERNANCE" | "INTEGRITY";
    description: string;

    evaluate: (event: any, context: ConstitutionContext) => ConstitutionDecision;
}

export interface ConstitutionContext {
    trustScore?: number;
    stewardHistoryCount?: number;
    isExternalSource?: boolean;
    calibrationVersion?: number;
}

export class TruthConstitutionV1 {
    private rules: ConstitutionRule[] = [];

    register(rule: ConstitutionRule) {
        this.rules.push(rule);
    }

    evaluate(event: any, context: ConstitutionContext = {}): ConstitutionDecision {
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

        return { allowed: true };
    }
}

// --- Rule Implementations ---

// 1. Epistemic Rules
export const epistemicNoLowTrustExternalOverride: ConstitutionRule = {
    id: "epistemic.no_low_trust_external_override",
    category: "EPISTEMIC",
    description: "External low-trust signals cannot override steward truth",
    evaluate: (event, ctx) => {
        if (event.type !== "SIGNAL_INGESTED") return { allowed: true };
        if (ctx.isExternalSource && (ctx.trustScore ?? 0) < 0.7) {
            return { allowed: false, reason: "Low-trust external signal blocked from truth layer" };
        }
        return { allowed: true };
    }
};

// 2. Governance Rules
export const governanceMinStewardHistory: ConstitutionRule = {
    id: "governance.min_steward_history",
    category: "GOVERNANCE",
    description: "New stewards must establish history before high-impact signals",
    evaluate: (event, ctx) => {
        if (event.type !== "SIGNAL_INGESTED") return { allowed: true };
        if ((ctx.stewardHistoryCount ?? 0) < 3 && event.payload.amount > 50) {
            return { allowed: false, reason: "Steward not mature enough for high-impact signal" };
        }
        return { allowed: true };
    }
};

// 3. Integrity Rules
export const integrityCalibrationConsistency: ConstitutionRule = {
    id: "integrity.calibration_consistency",
    category: "INTEGRITY",
    description: "Calibration version must remain consistent within a session",
    evaluate: (event, ctx) => {
        if (event.type !== "CALIBRATION_APPLIED") return { allowed: true };
        if (ctx.calibrationVersion && event.payload.calibrationVersion !== ctx.calibrationVersion) {
            return { allowed: false, reason: "Calibration version drift detected" };
        }
        return { allowed: true };
    }
};

// 4. Ethical Rules
export const ethicalNoRealityFabrication: ConstitutionRule = {
    id: "ethical.no_reality_fabrication",
    category: "ETHICAL",
    description: "System cannot fabricate high-confidence truth without event origin",
    evaluate: (event) => {
        if (!event.stewardId) {
            return { allowed: false, reason: "Unattributed truth assertion blocked" };
        }
        return { allowed: true };
    }
};
