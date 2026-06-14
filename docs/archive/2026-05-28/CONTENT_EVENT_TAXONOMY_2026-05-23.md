# Content Event Taxonomy — 2026-05-23

## Event Names and Responsibilities

- **content_generated**: Emitted when new content is deterministically generated for a business action. Marks the start of the communication lineage.
- **content_guardrail_triggered**: Emitted when a prohibited phrase or governance violation is detected. Captures ethical boundary enforcement.
- **cta_profile_selected**: Emitted when a CTA profile is chosen for the communication. Makes CTA selection observable and replayable.
- **platform_format_applied**: Emitted when platform-specific formatting is applied. Ensures rendering logic is visible in the event lineage.
- **template_selected**: Emitted when a business category template is chosen. Documents template specialization and its effect on the output.
- **public_caption_composed**: Emitted when the final customer-facing caption is composed. Marks the completion of the communication pipeline.

## Replay Semantics

Each event includes:
- event_type
- occurred_at (deterministic timestamp)
- platform
- goal_key
- business_category_key
- template_key
- cta_profile
- guardrails_passed
- guardrail_violations

## Governance Meaning

Every communication mutation is replay-visible. This ensures:
- explainable lineage
- auditability
- ethical observability
- deterministic reconstruction

## Allowed Payload Boundaries

Event payloads must only include fields necessary for deterministic replay and governance:
- No user secrets
- No non-deterministic data
- No concealed violations

---

This taxonomy is foundational for replay UI, analytics, mobile timelines, and audit reconstruction.
