export interface DocumentTemplate {
    template_key: string;
    document_type: string;
    version: number;
    required_fields: string[];
    optional_fields?: string[];
    status: 'active' | 'draft' | 'deprecated';
}

export const DOCUMENT_TEMPLATES: Record<string, DocumentTemplate> = {
    QUOTE_V1: {
        template_key: "QUOTE_V1",
        document_type: "quote",
        version: 1,
        required_fields: [
            "customer_name",
            "customer_phone",
            "service_description",
            "labour",
            "materials",
            "travel",
            "total",
        ],
        optional_fields: ["other", "vat"],
        status: "active",
    },
    QUOTE_V2: {
        template_key: "QUOTE_V2",
        document_type: "quote",
        version: 2,
        required_fields: [
            "customer_name",
            "customer_phone",
            "service_description",
            "line_items",
            "subtotal",
            "vat",
            "total",
            "archetype_key",
            "business_line",
            "quote_template_version",
        ],
        optional_fields: ["structured_terms"],
        status: "active",
    },
    INVOICE_V1: {
        template_key: "INVOICE_V1",
        document_type: "invoice",
        version: 1,
        required_fields: [
            "customer_name",
            "customer_phone",
            "invoice_number",
            "items",
            "total",
            "payment_status",
        ],
        optional_fields: ["due_date", "notes"],
        status: "active",
    },
    RECEIPT_V1: {
        template_key: "RECEIPT_V1",
        document_type: "receipt",
        version: 1,
        required_fields: [
            "customer_name",
            "receipt_number",
            "amount_paid",
            "payment_method",
            "date_paid"
        ],
        status: "active",
    },
    PROOF_OF_WORK_V1: {
        template_key: "PROOF_OF_WORK_V1",
        document_type: "proof_of_work",
        version: 1,
        required_fields: [
            "customer_name",
            "work_description",
            "before_photos",
            "after_photos",
            "completed_at",
        ],
        status: "active",
    },
    BUSINESS_PROFILE_V1: {
        template_key: "BUSINESS_PROFILE_V1",
        document_type: "business_profile",
        version: 1,
        required_fields: ["business_name", "services", "contact_number"],
        status: "active",
    }
};

export const validateDocumentData = (templateKey: keyof typeof DOCUMENT_TEMPLATES, data: Record<string, any>): string[] => {
    const template = DOCUMENT_TEMPLATES[templateKey];
    if (!template) throw new Error(`Template ${templateKey} not found.`);

    return template.required_fields.filter(field =>
        data[field] === undefined || data[field] === null || data[field] === ""
    );
};
