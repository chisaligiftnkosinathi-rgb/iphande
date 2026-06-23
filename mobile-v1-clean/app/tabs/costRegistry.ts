/**
 * Defines specific types of costs that can be incurred during work.
 */
export interface CostDefinition {
    key: string;
    label: string;
    description: string;
    category: 'direct' | 'infrastructure' | 'consumable';
}

export const COST_REGISTRY: Record<string, CostDefinition> = {
    fuel: {
        key: 'fuel',
        label: 'Fuel / Energy',
        description: 'Petroleum or electricity consumed during transport.',
        category: 'direct'
    },
    tolls: {
        key: 'tolls',
        label: 'Road Tolls',
        description: 'Fees paid for use of infrastructure.',
        category: 'direct'
    },
    data_gb: {
        key: 'data_gb',
        label: 'Internet Data',
        description: 'Connectivity costs for digital delivery.',
        category: 'direct'
    },
    cloud_credits: {
        key: 'cloud_credits',
        label: 'Cloud Hosting',
        description: 'Server and compute resources used.',
        category: 'infrastructure'
    },
    venue_hire: {
        key: 'venue_hire',
        label: 'Venue Hire',
        description: 'Physical space rental for teaching or events.',
        category: 'direct'
    },
    materials: {
        key: 'materials',
        label: 'Materials',
        description: 'Physical components used or transformed.',
        category: 'consumable'
    }
};
