/**
 * Layer 15 - Stewardship State Registry
 * Defines measured signals and interpreted conditions of a steward.
 *
 * Note: Effective signals are computed by applying influence buffers.
 */

export interface StewardSignals {
    /** 0.0 to 1.0 (Household, basic needs) */
    provisionScore: number;
    /** 0.0 to 1.0 (Active work, utilization) */
    tradeScore: number;
    /** 0.0 to 1.0 (Evidence, validation, reputation) */
    trustScore: number;
    /** 0.0 to 1.0 (Captured assets, history) */
    memoryScore: number;
    /** 0.0 to 1.0 (Lessons, capacity expanded) */
    growthScore: number;
    /** 0.0 to 1.0 (Cash flow, runway, invoices) */
    financeScore: number;
}

export interface StewardCondition {
    state: StewardState;
    reasons: string[];
    signals: StewardSignals;
}

export type StewardState =
    | "thriving"
    | "stable"
    | "strained"
    | "surviving"
    | "crisis";

export interface StewardStateDefinition {
    label: string;
    advice: string[];
}

export const STEWARD_STATE_REGISTRY: Record<StewardState, StewardStateDefinition> = {
    thriving: {
        label: "Thriving",
        advice: ["Invest", "Expand", "Train others", "Increase giving"],
    },
    stable: {
        label: "Stable",
        advice: ["Maintain reserves", "Improve efficiency"],
    },
    strained: {
        label: "Strained",
        advice: ["Reduce leaks", "Follow unpaid invoices", "Increase visibility"],
    },
    surviving: {
        label: "Surviving",
        advice: ["Focus only on immediate provision", "Prioritize highest-value opportunities"],
    },
    crisis: {
        label: "Crisis",
        advice: ["Emergency provision", "Community support", "Immediate opportunities"],
    },
};
