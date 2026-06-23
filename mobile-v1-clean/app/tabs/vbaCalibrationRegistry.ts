/**
 * Layer 14 - VBA Calibration Registry
 * Defines the functional stewardship nodes of the Assistant.
 */
export interface StewardshipNode {
    key: string;
    label: string;
    purpose: string;
    capabilities: string[];
    questions: string[];
    measurements?: string[];
    costs?: string[];
    evidence?: string[];
}

export const VBA_CALIBRATION_REGISTRY: Record<string, StewardshipNode> = {
    administration: {
        key: 'administration',
        label: 'Administration Steward',
        purpose: 'Organize, Record, Coordinate, Archive',
        capabilities: ['Organize', 'Record', 'Coordinate', 'Archive'],
        questions: ['What task needs to be done?'],
        evidence: ['document']
    },
    finance: {
        key: 'finance',
        label: 'Finance Steward',
        purpose: 'Calculate, Track, Report, Audit',
        capabilities: ['Calculate', 'Track', 'Report', 'Audit'],
        questions: [
            'Have all expenses been captured?',
            'Have all invoices been paid?',
            'What is the steward surplus?'
        ],
        evidence: ['receipt']
    },
    customer: {
        key: 'customer',
        label: 'Customer Steward',
        purpose: 'Listen, Respond, Resolve, Maintain Relationships',
        capabilities: ['Listen', 'Respond', 'Resolve', 'Maintain Relationships'],
        questions: [
            'Who have you not followed up with?',
            'Which customer needs attention today?'
        ],
        evidence: ['general']
    },
    visibility: {
        key: 'visibility',
        label: 'Visibility Steward',
        purpose: 'Communicate, Promote, Educate, Share',
        capabilities: ['Communicate', 'Promote', 'Educate', 'Share'],
        questions: [
            'Has today\'s work been shared?',
            'Has evidence been published?'
        ],
        evidence: ['before_after', 'general']
    },
    opportunity: {
        key: 'opportunity',
        label: 'Opportunity Steward',
        purpose: 'Match, Connect, Recommend, Discover',
        capabilities: ['Match', 'Connect', 'Recommend', 'Discover'],
        questions: [
            'What needs exist nearby?',
            'Which opportunities match your capabilities?'
        ]
    },
    trade: {
        key: 'trade',
        label: 'Trade Steward',
        purpose: 'Quote, Measure, Price, Negotiate',
        capabilities: ['Quote', 'Measure', 'Price', 'Negotiate'],
        questions: [
            'How many hours?',
            'How many kilometers?',
            'What materials were used?',
            'What is the dignity price?'
        ],
        measurements: ['labour_hours', 'distance_km', 'milestone_count'],
        costs: ['materials', 'fuel', 'tolls']
    },
    provision: {
        key: 'provision',
        label: 'Provision Steward',
        purpose: 'Protect Household, Budget, Forecast, Reserve',
        capabilities: ['Protect Household', 'Budget', 'Forecast', 'Reserve'],
        questions: [
            'Can this trade feed the household?',
            'How much provision remains?',
            'What is the monthly target?'
        ]
    },
    memory: {
        key: 'memory',
        label: 'Memory Steward',
        purpose: 'Remember, Verify, Preserve, Witness',
        capabilities: ['Remember', 'Verify', 'Preserve', 'Witness'],
        questions: [
            'What evidence exists?',
            'What work has been completed?',
            'Who can testify?'
        ],
        evidence: ['document', 'before_after', 'receipt', 'attendance']
    },
    trust: {
        key: 'trust',
        label: 'Trust Steward',
        purpose: 'Verify, Validate, Confirm, Build Reputation',
        capabilities: ['Verify', 'Validate', 'Confirm', 'Build Reputation'],
        questions: [
            'How trustworthy is this trade?',
            'How trustworthy is this steward?',
            'What evidence supports that trust?'
        ]
    },
    growth: {
        key: 'growth',
        label: 'Growth Steward',
        purpose: 'Teach, Coach, Improve, Calibrate',
        capabilities: ['Teach', 'Coach', 'Improve', 'Calibrate'],
        questions: [
            'Which capability should be strengthened?',
            'Which archetype is growing?',
            'Where is value leaking?'
        ]
    }
};
