# PHASE 11 — Additive Steward Annotation Layer

**Date:** 2026-05-25

## The Emergence of the Wisdom Layer

The system can now observe continuity, but it cannot yet converse with continuity. This phase introduces the first true "wisdom layer," allowing stewards to append interpretation to the causal river without granting them the power to rewrite it.

## Core Doctrine

```text
Interpretation may accompany continuity.
It may never replace continuity.
```

This is the transition from a system of pure memory to a system that supports governed interpretation.

## The Constitutional Shape

### Annotation Event Types

The act of interpretation is itself a continuity event.

*   `steward_annotation_added`
*   `steward_annotation_challenged`
*   `steward_annotation_resolved`

Crucially, there are no `annotation_edited` or `annotation_deleted` events. Even interpretations, once made, are part of the permanent record.

### Annotation Structure

Annotations are append-only, timestamped, attributable, and challengeable records with a bounded schema:

```json
{
  "annotation_id": "...",
  "target_event_id": "...",
  "steward_id": "...",
  "annotation_type": "context",
  "body": "Client requested delay after relocation.",
  "visibility": "bounded",
  "created_at": "..."
}
```

## Why This Matters

The system now preserves all four constitutional domains separately: Memory, Dignity, Authority, and Wisdom. By making interpretation itself a replay-visible act, we prevent the drift toward institutional mythology and ensure that even stewardship remains accountable to continuity.

This layer introduces human interpretation without human domination.
