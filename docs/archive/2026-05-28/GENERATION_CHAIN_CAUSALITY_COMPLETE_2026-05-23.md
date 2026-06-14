# Generation Chain Causality Complete

**Date:** 2026-05-23

## Milestone

Generated content replay events now form an explicit causal chain going forward.

## Chain

`template_selected`
→ `public_caption_composed`
→ `platform_format_applied`
→ `content_generated`

## Doctrine

- Causality is recorded, not inferred.
- Old events are not retroactively modified.
- Parent links are assigned only during new event creation.
- The chain is persisted inside the same atomic replay transaction.
- If content generation or replay persistence fails, the whole transaction rolls back.

## Verification

- New generated post: `d1a7502e-2078-48f0-8024-4da49a520c82`
- Graph result: `4 nodes`, `3 edges`
- Backend tests: `14 passed`
- Mobile typecheck: passed
