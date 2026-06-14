# Template Expansion Plan

**Date:** 2026-05-24

iPhande's next usefulness frontier is practical small-business content generation, expanded through governed templates rather than random prompt growth.

## Template Governance Rule

Each business template should define:

- Template key
- Business line
- Supported goals
- Default tone
- CTA style
- Sample offer details
- Guardrails
- Replay event expectations

In code, these are represented through blueprint fields such as `template_key`, `business_categories`, `goal_key`, `tone`, caption patterns, stewardship constraints, and variables.

## Phase 1: 15 Practical Local-Business Templates

Initial expansion should cover businesses iPhande naturally serves:

```text
funeral_cover
real_estate
retail
cleaning_services
church_ministry
commission_based_sales
beauty_salon
car_wash
catering
tutoring
plumbing
electrician
mechanic
security_services
events_decor
```

Implementation starts with five templates only:

```text
beauty_salon
car_wash
catering
cleaning_services
tutoring
```

This keeps the replay loop stable while expanding real-world usefulness.

## Phase 2: Tests For Each Template

Every template should have registry coverage proving:

- The right business category can select it.
- The supported goal is respected.
- Platform scoring prefers matching platforms.
- Stewardship constraints are present.
- Required variables are declared.

## Phase 3: Expose Templates To Mobile

The mobile app should eventually show available business lines and goals from the API rather than relying on hardcoded assumptions.

Useful mobile surfaces:

- Template/line selector
- Goal selector
- Offer details input
- Replay explanation after generation

## Phase 4: Workbook/VBA Template Selection

The workbook should be able to select or export template intent in a controlled way, including:

- Business owner
- Business category
- Business line
- Goal
- Offer details
- Platform

Workbook-originated template choices should still pass through API guardrails and replay persistence.

## Phase 5: Preserve Template Key In Replay Payload

The API should preserve `template_key` in replay payloads so every generated post can be traced back to the selected blueprint.

Replay should continue to show:

```text
prompt_context_built
template_selected
public_caption_composed
platform_format_applied
content_generated
```

The `template_selected` event should make the selected template key explicit.

## Current Boundary

This plan expands practical usefulness without weakening the constitutional rule:

> No generated content post should exist without explainable replay lineage.
