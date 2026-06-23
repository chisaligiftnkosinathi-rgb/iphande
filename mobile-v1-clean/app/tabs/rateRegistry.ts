/**
 * Defines suggested rates for measurements or costs.
 */
export interface RateDefinition {
    measurementKey: string;
    baseRate: number; // e.g., 4.50
    currency: string; // e.g., "ZAR"
    label: string;
}

export const RATE_REGISTRY: Record<string, RateDefinition> = {
    travel_standard: {
        measurementKey: 'distance_km',
        baseRate: 4.50,
        currency: 'ZAR',
        label: 'Standard Travel Rate (per km)'
    },
    labour_standard: {
        measurementKey: 'labour_hours',
        baseRate: 150.00,
        currency: 'ZAR',
        label: 'Standard Labour Rate (per hour)'
    },
    digital_delivery: {
        measurementKey: 'milestone_count',
        baseRate: 500.00,
        currency: 'ZAR',
        label: 'Milestone Base Rate'
    }
};
