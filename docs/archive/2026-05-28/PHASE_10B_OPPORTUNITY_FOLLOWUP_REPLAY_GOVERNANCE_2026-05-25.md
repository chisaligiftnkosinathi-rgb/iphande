# PHASE 10B — Opportunities & Follow-ups Replay Governance

**Date:** 2026-05-25

## Milestone Summary
Opportunities and Follow-ups are no longer isolated CRUD mutations. They have entered the unified causal river, transforming from mere data rows into observable stewardship artifacts.

* **Opportunity** = Emerging intent
* **Follow-up** = Stewardship response to continuity

## Core Architectural Changes

1. **Raw Commits Eradicated:** All bare `db.commit()` calls have been removed from `opportunity_routes.py` and `followup_routes.py`.
2. **Transaction Governance:** All creations and updates are now bound by atomic `replay_transaction` context managers.
3. **Continuity Events Emitted:** The system now emits `opportunity_created`, `opportunity_amended`, `followup_created`, and `followup_amended`.
4. **Causal Lineage Intact:** Operations link to their predecessor via `parent_event_id`, meaning a follow-up never appears as an isolated action—it is visibly anchored to prior continuity.

## Payload Discipline & Human Dignity

The system explicitly limits the data exposed during an amendment.

Instead of preserving invasive before/after text diffs that track a human's private reasoning, the payload captures:
```json
{
  "updated_fields": ["completed"],
  "summary_available": true
}
```

## Timeline Comprehension

The Steward Timeline Service has been updated to read these new events safely. It interprets amendments as **structural changes**, refusing to manufacture false certainty about the human's private intent.

## Sealed Principle

```text
The system may reveal that stewardship changed shape.
It may not expose private substance or silently redefine meaning.
```

*Phase 10B is sealed. The steward can observe without invasive possession.*
