# HOME_SCREEN_CONTEXTUAL_ACTIONS_BOUNDARY_2026-05-27

## Milestone Summary
The Contextual Action Surface has been gracefully introduced to the `HomeScreen` via the `StewardQuickActions` component. This serves as an "intent illumination layer," offering high-level workflow entry points without cluttering the screen with granular, overwhelming choices.

## Architectural Significance
* **Archetype-Aware Illumination:** The UI automatically filters out the "Draft Document" button if the steward's economic archetype has no registered templates, preventing dead-end clicks and confusion.
* **No Payload Invention:** When launching the `DocumentComposer` or `MediaIngestion` modals, context (`opportunity_id`, `target_continuity_event_id`) is passed strictly as `undefined`. This correctly informs the system that this intent is originating as root-level continuity, not attached to an existing lineage.
* **Gentle Continuity Feedback:** The system provides a calm, descriptive message if document tools are unavailable, treating absence as a known state rather than a silent failure.

## The Governing Rule
> The system illuminates available paths. The steward chooses which path to walk.

## Next Safe Move
Run `npx tsc --noEmit` to confirm the parameter-less `navigateTo` calls satisfy TypeScript.

With the general context layer mapped on the Home screen, the next step is to implement the lineage-aware context layer—wiring these exact same actions into the `OpportunityCard` to securely pass specific `opportunity_id` values upward into the Action Stack.

---
*“Let the record show: Actions are invitations, not obligations.”*
