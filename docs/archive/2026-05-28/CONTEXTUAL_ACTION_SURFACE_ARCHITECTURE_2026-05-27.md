# CONTEXTUAL ACTION SURFACE ARCHITECTURE

**Date:** 2026-05-27

## Purpose
To define how operational workflows (Document Composition, Media Ingestion, Payment Review, etc.) are launched and orchestrated within the mobile UI.

## Core Doctrine
> Actions emerge from context. They do not clutter the continuity surface.

## 1. Action Surface Philosophy
Actions are transient intent-gathering workflows, not persistent navigation destinations. A steward does not "go to the document screen"; a steward "drafts a proposal" from within an Opportunity. Therefore, composition surfaces must never exist as Bottom Tabs. They are contextual, purposeful, and temporary.

## 2. Context-Aware Launch Points
Actions are triggered from stable continuity surfaces. The origin of the click dictates the context of the workflow:
*   **General Context:** Launched from the `HomeScreen` (e.g., "Declare New Media", "Draft General Catalogue").
*   **Lineage Context:** Launched from an `OpportunityCard` or `ReplayEventDetail` (e.g., "Attach Proposal to this Quote", "Add Follow-up Photo").

## 3. Archetype-Aware Action Visibility
Buttons launching these actions do not appear randomly. The UI must mathematically filter available actions using the backend dictionaries:
*   A `funeral_cover` steward sees "Draft Family Cover Proposal".
*   A `tutor` sees "Draft Learning Guide".
*   If an archetype has no templates in the `ARCHETYPE_DOCUMENT_TEMPLATES` registry, the "Draft Document" button mathematically does not render.

## 4. Safe Navigation Strategy (Modal Stacks)
To enforce the philosophy of transient workflows, these screens will be implemented as **Modal Stack Screens** sitting *on top* of the Tab Navigator (`presentation: 'modal'` in React Navigation).
*   **Upward motion:** The workflow slides up over the context.
*   **Downward dismissal:** Once the steward taps "Submit Draft," the modal dismisses, returning the user to the exact context that launched it.

## 5. Draft Lifecycle Philosophy
A draft is volatile local state until it is submitted to the backend. The Contextual Action Surface is responsible for holding this volatile state. If the steward swipes the modal away before submitting, the intent is discarded. The frontend does not attempt to secretly auto-save or persist half-finished thoughts to SQLite, preserving the boundary that *intent requires explicit submission*.

## 6. Route Ownership Boundaries
*   **`GovernedTabs`** owns: Stable read-only or continuity-observation surfaces (`Home`, `Opportunities`, `Profile`, `Timeline`).
*   **`ActionStack`** owns: `DocumentComposerScreen`, `MediaIngestionScreen`, `PaymentReviewScreen`.
*   The `ActionStack` wraps the `GovernedTabs`, allowing any tab to summon an action modal.

## 7. Future Replay-Binding Boundary
When an action is launched, it must accept a `target_continuity_event_id` or `opportunity_id` via its route parameters (`route.params`).
*   If launched from `Home`, this parameter may be `null` (creating a root-level event).
*   If launched from an `Opportunity`, the parameter is populated.
*   The Action Surface blindly passes this parameter into the `DocumentDraftPayload` or `MediaArtifactPayload`, ensuring the backend weaving engine knows exactly where to anchor the resulting artifact.

## 8. HomeScreen Orchestration Strategy
The `HomeScreen` acts as the root operational control panel.
*   It will feature a `<StewardActions>` semantic component.
*   This component loops through allowed media types and document templates for the steward's archetype, rendering "Quick Actions" (e.g., "Upload Store Photo", "Draft Specials Catalogue").
*   Artifacts generated here bind to the general business timeline.

## 9. OpportunitiesScreen Orchestration Strategy
The `OpportunitiesScreen` acts as a lineage-specific control panel.
*   Inside each `OpportunityCard`, the UI will render context-specific actions (e.g., "Attach Quote", "Log Voice Note").
*   Artifacts generated here are strictly bound to the specific `opportunity_id`, allowing the system to build a perfect, isolated chronological history of a single client interaction.

## 10. Governance Boundaries
*   **No Forced Actions:** The UI illuminates what is possible; it does not force the user into a funnel.
*   **No Silent Binding:** The UI explicitly tells the user where the artifact will be attached (e.g., "Drafting proposal for Opportunity #123").
*   **Context dictates Structure:** The navigation route carries the constitutional parameters (archetype, target lineage). The destination screen merely renders them.

---
*“Let the record show: Operations rise from reality, serve their purpose, and return to reality.”*
