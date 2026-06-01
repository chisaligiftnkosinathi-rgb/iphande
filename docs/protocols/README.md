# Protocol Index

This folder contains governance and execution protocols for iPhande work.

## Primary V1 Protocols

1. [iPhande V1 Work Protocol (2026-06-01)](./iphande_v1_work_protocol_2026-06-01.md)
Purpose: Defines the immediate governed coding workflow and role boundaries for active implementation sessions.
Use when: starting or running a concrete coding task and you need explicit Observe -> Interpret -> Patch -> Verify -> Archive discipline.

2. [iPhande V1 Stewardship River Protocol (2026-06-01)](./iphande_v1_stewardship_river_protocol_2026-06-01.md)
Purpose: Defines the higher-level continuity model so decisions survive context switches, model changes, and contributor handoffs.
Use when: framing governance, onboarding collaborators, or auditing whether work flow remains aligned with stewardship values.

## How They Align

- The Stewardship River protocol is the governing continuity doctrine.
- The Work Protocol is the operational execution playbook for implementation tasks.
- If there is tension, follow the stricter continuity-preserving interpretation and escalate to Steward approval.

## Recommended Task Start

1. Confirm Intent and scope with Steward.
2. Run Observe-only evidence collection.
3. Perform Interpret-only analysis.
4. Review patch sequence for smallest safe change.
5. Patch only after explicit approval.
6. Verify with compiler/tests.
7. Archive what changed and why.

## Archive Logs

1. [Identity Patch Log](./identity_patch_log.md)
Purpose: Immutable archive entries for bounded Identity Layer patches, verification outcomes, and scope boundaries.

2. [Manual V1 Identity Walkthrough - Intent Record (2026-06-01)](./identity_manual_v1_walkthrough_intent_2026-06-01.md)
Purpose: Replayable runtime verification plan and evidence template for post-003C manual identity truth validation.

3. [Identity Manual V1 Supabase Pooler Smoke Evidence (2026-06-01)](./identity_manual_v1_supabase_pooler_smoke_evidence_2026-06-01.md)
Purpose: Live runtime evidence that ownership create/get/idempotency contract holds against Supabase using the transaction pooler path.

4. [Identity V1 Stewardship Gate - PASSED (2026-06-01)](./identity_v1_stewardship_gate_passed_2026-06-01.md)
Purpose: Formal milestone seal recording that Identity V1 continuity is proven across auth, mobile, API, and persistence.
