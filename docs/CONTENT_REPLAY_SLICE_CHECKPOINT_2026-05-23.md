# Content Replay Slice Checkpoint — 2026-05-23

The content generation pipeline now emits a minimal, explainable event lineage for every communication mutation:

- **template_selected**: Includes the template key used for generation.
- **public_caption_composed**: Includes guardrail state (pass/fail, violations).
- **platform_format_applied**: Includes hashtag presence and CTA used.

These events are exposed in the API response as `events` and `event_count`, making the replay shape visible and testable. This milestone marks the transition from response-shaped to replay-shaped communication, enabling explainable, auditable, and deterministic business content replay.
