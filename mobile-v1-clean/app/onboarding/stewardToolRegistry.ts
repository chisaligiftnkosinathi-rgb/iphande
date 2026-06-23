export type ToolKey =
    | 'quote_builder'
    | 'materials_calculator'
    | 'travel_calculator'
    | 'before_after_proof'
    | 'expense_tracker'
    | 'inventory_tracker'
    | 'lead_tracker'
    | 'commission_calculator'
    | 'whatsapp_followup'
    | 'receipt_capture'
    | 'project_milestone_tracker'
    | 'document_generator'
    | 'proof_of_work'
    | 'vba_console'
    | 'documents'
    | 'notebook'
    | 'referrals'
    | 'km_tracker';

export interface StewardToolSet {
    tools: ToolKey[];
    costInputs: string[];
    proofRequired: string[];
}

export const STEWARD_TOOL_REGISTRY: Record<string, StewardToolSet> = {
    fixer: {
        tools: [
            'quote_builder',
            'materials_calculator',
            'travel_calculator',
            'before_after_proof',
            'expense_tracker',
            'inventory_tracker'
        ],
        costInputs: [
            'labour',
            'materials',
            'travel',
            'call_out_fee',
            'other'
        ],
        proofRequired: [
            'before_photo',
            'after_photo',
            'customer_note',
            'payment_proof'
        ]
    },
    seller: {
        tools: [
            'lead_tracker',
            'commission_calculator',
            'whatsapp_followup',
            'receipt_capture',
            'expense_tracker'
        ],
        costInputs: [
            'commission_rate',
            'sale_value',
            'transport',
            'airtime_data'
        ],
        proofRequired: [
            'lead_record',
            'customer_confirmation',
            'receipt'
        ]
    },
    system_creator: {
        tools: [
            'quote_builder',
            'project_milestone_tracker',
            'document_generator',
            'proof_of_work',
            'expense_tracker',
            'vba_console'
        ],
        costInputs: [
            'labour_hours',
            'software_tools',
            'cloud_hosting',
            'data',
            'device_costs',
            'travel'
        ],
        proofRequired: [
            'requirements_document',
            'build_log',
            'screenshots',
            'deployment_note',
            'customer_acceptance'
        ]
    },
    maker: {
        tools: ['quote_builder', 'materials_calculator', 'expense_tracker', 'inventory_tracker', 'proof_of_work'],
        costInputs: ['labour', 'materials', 'other'],
        proofRequired: ['before_photo', 'after_photo', 'customer_note']
    },
    carrier: {
        tools: ['quote_builder', 'travel_calculator', 'receipt_capture', 'expense_tracker', 'km_tracker'],
        costInputs: ['distance', 'fuel', 'tolls', 'time'],
        proofRequired: ['receipt', 'delivery_note']
    },
    caregiver: {
        tools: ['quote_builder', 'expense_tracker', 'proof_of_work'],
        costInputs: ['hourly_rate', 'materials', 'transport'],
        proofRequired: ['customer_note', 'attendance_record']
    },
    teacher_guide: {
        tools: ['quote_builder', 'expense_tracker', 'proof_of_work', 'documents'],
        costInputs: ['hourly_rate', 'session_rate', 'materials'],
        proofRequired: ['attendance_record', 'customer_feedback']
    },
    organizer: {
        tools: ['quote_builder', 'expense_tracker', 'document_generator', 'documents'],
        costInputs: ['flat_rate', 'venue_hire', 'catering', 'communication'],
        proofRequired: ['event_plan', 'budget', 'attendance_photos']
    },
    // Default fallback
    general: {
        tools: ['quote_builder', 'expense_tracker', 'proof_of_work', 'documents', 'notebook', 'referrals'],
        costInputs: ['labour', 'materials', 'other'],
        proofRequired: ['customer_note', 'payment_proof']
    }
};
