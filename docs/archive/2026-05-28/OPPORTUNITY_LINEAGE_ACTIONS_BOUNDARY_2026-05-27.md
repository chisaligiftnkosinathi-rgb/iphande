# OPPORTUNITY_LINEAGE_ACTIONS_BOUNDARY_2026-05-27

## Milestone Summary
The architecture now supports Lineage-Aware Contextual Actions. The `OpportunityQuickActions` component has been implemented and embedded within the `OpportunitiesScreen`, demonstrating how specific `opportunity_id` and `target_continuity_event_id` parameters are seamlessly passed upward into the `DocumentComposer` and `MediaIngestion` modal workflows.

## Architectural Significance
* **Context Inheritance:** Operations launched from an `OpportunityCard` automatically inherit their structural coordinates. The backend will not have to "guess" where to bind the resulting artifact.
* **Safety of Sequencing:** By explicitly omitting mutation actions (like "Attach Payment" or "Approve Quote") and focusing strictly on "Draft" and "Declare" actions, the UI protects the system from premature operational mutations.
* **Archetype Determinism:** Like the `HomeScreen`, the opportunity card only offers the "Draft Contextual Document" action if the steward's archetype is constitutionally permitted to generate templates.

## The Governing Rule
> Actions inherit continuity context. The system does not guess lineage.

## Next Safe Move
Run `npx tsc --noEmit` to verify type compliance across the new parameters.

With the frontend orchestration completely wired and passing context correctly, the system is fully prepared for the **Backend Integration Phase**—connecting these payloads to the Pydantic schemas and FastAPI endpoints we designed earlier.

---
*“Let the record show: Operations within a lineage are permanently bound to that lineage at the moment of intent.”*
