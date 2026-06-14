# PHASE 16A — Continuity Capture Repo Surface Map

**Date:** 2026-05-28
**Status:** Implementation Bridge
**Parent Doctrine:** docs/PHASE_16_CONTINUITY_CAPTURE_CONSTITUTION_2026-05-28.md

## Purpose

This document maps the Continuity Capture Constitution to the existing iPhande repo so implementation proceeds by reuse, alignment, and careful extension rather than duplication.

## Governing Rule

No new capture feature may be created outside the continuity doctrine.

All future capture surfaces must preserve:

- raw signal first
- replayability
- human dignity
- steward-led correction
- no silent deletion
- structure later
- no shame-based reminders

## Surface Map

| Doctrine Surface | Existing Repo Surface | Current Maturity | Required Next Action |
|---|---|---|---|
| Media ingestion | `mobile/screens/MediaIngestionScreen.tsx`, `api/src/routes/media_routes.py`, `api/src/services/media_service.py`, `api/src/models/media.py` | Existing surface | Reframe as raw continuity signal capture |
| Timeline | `mobile/screens/TimelineScreen.tsx`, `api/src/routes/timeline_routes.py`, `api/src/services/timeline_service.py` | Existing surface | Make it the visible continuity stream |
| Replay | `mobile/ReplayStack.tsx`, `api/src/replay/`, `api/src/events/continuity_event_types.py` | Strong foundation | Bind all capture events to replay |
| Reflections | `mobile/screens/ReflectionsScreen.tsx`, `api/src/routes/reflection_routes.py`, `api/src/services/reflection_service.py` | Existing wisdom layer | Preserve lessons from forgotten promises and recovery moments |
| Opportunities | `mobile/screens/OpportunitiesScreen.tsx`, `api/src/routes/opportunity_routes.py`, `api/src/services/opportunity_service.py` | Existing surface | Connect opportunity leakage to continuity inbox |
| Follow-ups | `api/src/routes/followup_routes.py`, `api/src/services/opportunity_service.py` | Partial surface | Promote follow-up into promise preservation |
| Quotes | `mobile/screens/QuoteRequestsScreen.tsx`, `mobile/screens/QuoteToCashScreen.tsx`, `api/src/routers/quotes.py`, `api/src/routes/quote_request_routes.py` | Strong business flow | Capture quote promises before formal quote generation |
| Payments | `mobile/screens/PaymentReviewScreen.tsx`, `api/src/routers/payments.py`, `api/src/models/payment_intent.py` | Existing payment review | Treat screenshots/SMS/payment notes as raw payment signals first |
| Stewardship | `mobile/screens/StewardshipLedgerScreen.tsx`, `api/src/routes/giving_routes.py`, `api/src/routers/giving_events.py` | Existing stewardship layer | Connect obligations, giving, and support to continuity replay |
| Annotations | `api/src/routes/steward_annotations.py`, `api/src/models/steward_annotation.py`, `api/src/services/transition_audit_service.py` | Existing append layer | Use for steward-led correction, never silent overwrite |

## Architectural Gap

The missing bridge is:

```
Continuity Inbox
```

The Continuity Inbox must become the humane entry point for:

* voice notes
* screenshots
* quick text fragments
* payment proofs
* WhatsApp context
* promise reminders
* unresolved obligations

## Proposed New Files

```
mobile/screens/ContinuityInboxScreen.tsx
api/src/routes/continuity_capture_routes.py
api/src/services/continuity_capture_service.py
api/src/schemas/continuity_capture_schema.py
api/src/models/continuity_capture.py
api/tests/test_continuity_capture.py
```

## Acceptance Criteria

The next implementation is valid only if:

* capture works before classification
* raw signal is preserved
* no capture is silently overwritten
* every structured interpretation links back to the original signal
* reminders use dignity-preserving language
* unresolved promises are surfaced gently
* steward correction is append-only

## Implementation Sequence

1. Create backend continuity capture model/schema/service/route.
2. Add continuity capture tests.
3. Add mobile Continuity Inbox screen.
4. Wire capture into timeline.
5. Wire capture into replay.
6. Later classify captures into promises, opportunities, quotes, payments, and reflections.

## Sealed Statement

iPhande will not force overwhelmed humans to become structured before they are remembered.

The system will receive fragments, preserve them truthfully, and help the steward return to them with dignity.
