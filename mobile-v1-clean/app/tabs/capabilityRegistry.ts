/**
 * Layer 3 - Capability Registry
 * Capabilities are the practical gifts used to fulfill a calling.
 */
export interface CapabilityDefinition {
    key: string;
    label: string;
    description: string;
}

export const CAPABILITY_REGISTRY: Record<string, CapabilityDefinition> = {
    build: { key: 'build', label: 'Build', description: 'Constructing physical or digital structures.' },
    repair: { key: 'repair', label: 'Repair', description: 'Fixing what is malfunctioning.' },
    teach: { key: 'teach', label: 'Teach', description: 'Instructing others in a skill.' },
    write: { key: 'write', label: 'Write', description: 'Communicating through text.' },
    calculate: { key: 'calculate', label: 'Calculate', description: 'Working with numbers and logic.' },
    coordinate: { key: 'coordinate', label: 'Coordinate', description: 'Managing logistics and people.' },
    transport: { key: 'transport', label: 'Transport', description: 'Moving items or people.' },
    sell: { key: 'sell', label: 'Sell', description: 'Exchanging value for currency.' },
    research: { key: 'research', label: 'Research', description: 'Investigating and gathering data.' },
    analyze: { key: 'analyze', label: 'Analyze', description: 'Interpreting data for meaning.' },
    code: { key: 'code', label: 'Code', description: 'Writing executable logic.' },
    design: { key: 'design', label: 'Design', description: 'Planning the form and function of objects.' },
    inspect: { key: 'inspect', label: 'Inspect', description: 'Evaluating quality and compliance.' },
    test: { key: 'test', label: 'Test', description: 'Verifying that things work as intended.' },
    measure: { key: 'measure', label: 'Measure', description: 'Quantifying physical or digital traits.' },
    document: { key: 'document', label: 'Document', description: 'Recording evidence and memory.' },
};
