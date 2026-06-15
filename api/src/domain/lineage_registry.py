LINEAGE_REGISTRY = {
    "SOFTWARE_DEVELOPMENT": {
        "version": 1,
        "label": "Software Development",
        "group": "economic",
        "description": "Requirements, build work, releases, support, invoices, and proof.",
        "required_evidence_types": [
            "requirement",
            "build_record",
            "release",
            "support_record",
            "invoice",
            "payment_proof",
        ],
    },
    "COMMISSION_BASED_SALES": {
        "version": 1,
        "label": "Commission-Based Sales",
        "group": "economic",
        "description": "Leads become quotes, applications, approvals, and commissions.",
        "required_evidence_types": [
            "lead",
            "quote",
            "application",
            "proof",
            "commission_record",
        ],
    },
    "REPAIR_MAINTENANCE": {
        "version": 1,
        "label": "Repair & Maintenance",
        "group": "economic",
        "description": "Inspection, diagnosis, repair, parts, proof, and payment.",
        "required_evidence_types": [
            "inspection",
            "diagnosis",
            "repair_record",
            "parts_record",
            "before_photo",
            "after_photo",
            "payment_proof",
        ]
    },
    "SERVICE_BUSINESS": {
        "version": 1,
        "label": "Service Business",
        "group": "economic",
        "description": "Work is requested, performed, proved, invoiced, and paid.",
        "required_evidence_types": [
            "quote_request",
            "quote",
            "work_record",
            "invoice",
            "payment",
        ]
    }
}
