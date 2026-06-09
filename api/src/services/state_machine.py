from fastapi import HTTPException

# The Constitutional Map of Allowed Continuity, By Lineage
ALLOWED_TRANSITIONS_BY_LINEAGE = {
    "commission_based_sales": {
        "new": ["quote_reviewed", "quote_closed"],
        "quote_requested": ["quote_reviewed", "quote_closed", "application_submitted"],
        "quote_reviewed": ["quote_contacted", "quote_converted", "quote_closed"],
        "quote_contacted": ["quote_converted", "quote_closed"],
        "quote_converted": ["quote_closed"],
        "application_submitted": ["evidence_review_pending", "quote_closed"],
        "evidence_review_pending": ["sale_confirmed", "declined"],
        "sale_confirmed": ["commission_expected"],
        "commission_expected": ["commission_approved", "commission_clawed_back"],
        "commission_approved": ["commission_paid", "commission_clawed_back"],
        "commission_paid": ["commission_clawed_back"],
    },
    "retail_stock": {
        "inventory_intake": ["stock_available"],
        "stock_available": ["stock_consumed", "sale_completed"],
        "sale_completed": ["cash_received"],
    },
}

def enforce_transition_for_lineage(
    lineage_key: str,
    current_state: str,
    target_state: str,
    entity_name: str = "Entity",
):
    transitions = ALLOWED_TRANSITIONS_BY_LINEAGE.get(lineage_key)

    if not transitions:
        transitions = ALLOWED_TRANSITIONS_BY_LINEAGE.get("commission_based_sales")
        if not transitions:
            raise HTTPException(status_code=409, detail=f"No state machine registered for lineage '{lineage_key}'.")

    if current_state == target_state:
        return

    allowed_targets = transitions.get(current_state, [])

    if target_state not in allowed_targets:
        raise HTTPException(
            status_code=409,
            detail=(
                f"Illegal state transition for lineage '{lineage_key}'. "
                f"{entity_name} cannot jump from '{current_state}' to '{target_state}'."
            ),
        )
