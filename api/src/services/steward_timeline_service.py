from sqlalchemy.orm import Session
from src.models.continuity_event_model import ContinuityEvent
from typing import Any, Dict, List

EVENT_LABELS = {
    "reflection_recorded": "Reflection recorded",
    "reflection_amended": "Reflection amended",
    "reflection_archived": "Reflection archived",
    "scripture_reflection_recorded": "Scripture reflection recorded",
    "scripture_reflection_amended": "Scripture reflection amended",
    "scripture_reflection_archived": "Scripture reflection archived",
    "content_generated": "Content generated",
    "payment_intent_created": "Payment intent created",
    "payment_evidence_submitted": "Payment evidence submitted",
    "evidence_check_passed": "Evidence check passed",
    "evidence_check_failed": "Evidence check failed",
    "payment_under_review": "Payment under review",
    "payment_verified": "Payment verified",
    "payment_rejected": "Payment rejected",
    "receipt_issued": "Receipt issued",
    "payment_confirmed": "Payment confirmed",
    "giving_recorded": "Giving recorded",
    "quote_created": "Quote drafted",
    "quote_request_received": "Quote request received",
    "application_submitted": "Application submitted",
    "invoice_created": "Invoice issued",
    "opportunity_created": "Opportunity emerged",
    "opportunity_amended": "Opportunity amended",
    "followup_created": "Stewardship follow-up planned",
    "followup_amended": "Stewardship follow-up updated",
    "steward_annotation_added": "Steward annotation added",
    "media_ingested": "Media ingested",
    "media_analyzed": "Media analyzed",
    "content_draft_approved": "Content draft approved",
    "content_draft_rejected": "Content draft rejected",
    "system_interpretation_corrected": "System interpretation corrected",
}

EVENT_BOUNDARIES = {
    "payment_evidence_submitted": "Customer claim; not yet verified.",
    "evidence_check_passed": "System check passed; not verification.",
    "evidence_check_failed": "System check failed; evidence insufficient.",
    "payment_under_review": "Pending steward review.",
    "payment_verified": "Steward verified.",
    "payment_confirmed": "Confirmed via provider.",
    "receipt_issued": "Receipt issued.",
    "reflection_recorded": "Steward reflection.",
    "scripture_reflection_recorded": "Steward scripture reflection.",
    "content_generated": "Generated communication blueprint.",
    "quote_created": "Quote draft prepared.",
    "application_submitted": "Customer application submitted.",
    "opportunity_created": "Steward identified an emerging intent.",
    "opportunity_amended": "Opportunity record was structurally amended.",
    "followup_created": "Steward scheduled a continuity response.",
    "followup_amended": "Follow-up record was structurally amended.",
    "steward_annotation_added": "Steward interpreted the continuity.",
    "media_ingested": "Human-provided media was ingested as evidence or context.",
    "media_analyzed": "System interpretation is provisional; requires human approval.",
    "content_draft_approved": "Steward finalized and approved the intent.",
    "content_draft_rejected": "Steward rejected the provisional assistance.",
    "system_interpretation_corrected": "Steward corrected a provisional system interpretation.",
}

def _build_payload_summary(payload: dict) -> dict[str, Any]:
    summary = {}
    if not payload:
        return {"summary_available": False}

    safe_keys = [
        "platform", "goal_key", "amount", "currency", "file_name",
        "evidence_status", "failures", "previous_status", "next_status",
        "receipt_number", "payment_reference", "provider_name", "has_wins",
        "has_challenges", "situation_key", "scripture_reference",
        "surface",
        "action",
        "updated_fields",
        "annotation_type",
        "visibility",
        "source",
        "media_type",
        "analysis_mode",
        "human_approval_required",
        "context_sources_used",
        "context_gaps",
        "evidence_boundary",
        "previous_interpretation_type",
        "corrected_interpretation_type",
        "intent_hypothesis_approved",
        "intent_hypothesis_rejected",
        "approved_caption",
        "approved_cta",
    ]
    for k in safe_keys:
        if k in payload:
            summary[k] = payload[k]

    return summary if summary else {"summary_available": False}

def get_steward_timeline(db: Session, business_owner_id: str) -> List[Dict[str, Any]]:
    events = (
        db.query(ContinuityEvent)
        .filter(ContinuityEvent.business_owner_id == business_owner_id)
        .order_by(ContinuityEvent.lineage_sequence.asc())
        .all()
    )

    timeline = []
    for ev in events:
        payload = ev.payload_json or {}
        timeline_event = {
            "id": ev.id,
            "event_type": ev.event_type,
            "related_entity_type": ev.related_entity_type,
            "related_entity_id": ev.related_entity_id,
            "parent_event_id": ev.parent_event_id,
            "lineage_sequence": ev.lineage_sequence,
            "created_at": ev.created_at,
            "payload_summary": _build_payload_summary(payload),
            "human_readable_label": EVENT_LABELS.get(ev.event_type, ev.event_type),
            "epistemic_boundary": EVENT_BOUNDARIES.get(ev.event_type, "Recorded event; interpretation not inferred"),
        }
        timeline.append(timeline_event)

    return timeline
