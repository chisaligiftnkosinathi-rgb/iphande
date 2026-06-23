/**
 * Defines the deterministic rules for a specific Trade Role.
 * Focuses on HOW work is measured and what cost inputs are valid.
 */
export interface StewardLedgerRuleSet {
    defaultMeasurementKey: string;
    costRegistryKeys: string[]; // References keys in COST_REGISTRY
}

export const STEWARD_LEDGER_RULES: Record<string, StewardLedgerRuleSet> = {
    fixer: {
        defaultMeasurementKey: 'labour_hours',
        costRegistryKeys: ['materials', 'tolls'],
    },

    carrier: {
        defaultMeasurementKey: 'distance_km',
        costRegistryKeys: ['fuel', 'tolls'],
    },

    system_creator: {
        defaultMeasurementKey: 'milestone_count',
        costRegistryKeys: ['cloud_credits', 'data_gb'],
    }
};
