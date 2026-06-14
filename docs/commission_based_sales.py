COMMISSION_BASED_SALES_LINEAGE = {
    "lineage_key": "commission_based_sales",
    "name": "Commission-Based Sales",
    "description": "Continuity pattern for leads, quotes, applications, proof, and commission.",
    "examples": ["Funeral Policy Steward", "Insurance Broker", "Real Estate Referral Agent"],
    "capabilities": [
        "content_generation",
        "lead_capture",
        "quote_requests",
        "payment_review",
        "commission_ledger",
        "stewardship",
        "replay"
    ],
    "workflow_order": [
        "lead_capture",
        "quote_requests",
        "payment_review",
        "commission_ledger"
    ],
    "commission_pipeline_stages": [
        "lead_captured",
        "lead_qualified",
        "quote_created",
        "application_submitted",
        "sale_confirmed",
        "commission_expected",
        "commission_approved",
        "commission_paid",
        "commission_clawed_back"
    ],
    "evidence_types": [
        "quote_request",
        "policy_application",
        "payment_proof"
    ],
    "events": [
        "lead_quote_request_captured",
        "payment_intent_created",
        "receipt_uploaded"
    ]
}
