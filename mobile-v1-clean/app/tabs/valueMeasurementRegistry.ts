export interface ValueMeasurement {
    key: string;
    label: string;
    unit: string;
    vbaQuestion: string;
}

export const VALUE_MEASUREMENT_REGISTRY: Record<string, ValueMeasurement> = {
    labour_hours: {
        key: 'labour_hours',
        label: 'Labour',
        unit: 'hrs',
        vbaQuestion: 'How many hours of focused work were applied?'
    },
    distance_km: {
        key: 'distance_km',
        label: 'Travel',
        unit: 'km',
        vbaQuestion: 'What was the total distance covered?'
    },
    quantity_unit: {
        key: 'quantity_unit',
        label: 'Quantity',
        unit: 'pcs',
        vbaQuestion: 'How many units were produced or delivered?'
    },
    milestone_count: {
        key: 'milestone_count',
        label: 'Milestones',
        unit: 'count',
        vbaQuestion: 'How many project milestones were achieved?'
    }
};
