# CONTINUITY MEDIA ARCHITECTURE

**Date:** 2026-05-27

## Purpose
Define the architectural foundation for `ContinuityMediaArtifact` within iPhande. Media is not decoration. It is continuity evidence, expression, memory, and context. It acts alongside documents and replay events to form a complete, truthful business memory.

## Core Doctrine
> Media preserves context. It does not manufacture proof.

**The Continuity Triad:**
* Documents preserve long-form continuity.
* Media preserves sensory continuity.
* Replay preserves causal continuity.

## 1. MediaTypeRegistry (Sensory Typology)
Media artifacts are strictly typed to preserve their semantic meaning and appropriate rendering:
* `image`, `photograph`, `thumbnail`, `poster`, `artwork`, `diagram`
* `audio`, `voice_note`, `music`
* `video`
* `document_attachment`

## 2. MediaOrigin (Provenance)
Every `ContinuityMediaArtifact` must carry an immutable origin classification to ensure AI or system-generated assets are never mistaken for human reality:
* `STEWARD_UPLOADED` (Existing media provided by the steward)
* `STEWARD_RECORDED` (Captured live within the iPhande interface)
* `SYSTEM_GENERATED` (Charts, generated thumbnails, timeline exports)
* `AI_ASSISTED` (Enhanced, expanded, or generated media)
* `REPLAY_BOUND` (Media derived directly from a timeline reconstruction)
* `EXTERNAL_LINKED` (Reference to off-platform media)

## 3. MediaUsagePolicy (Governance Boundaries)
The ingestion and display of media are bound by strict epistemological humility:
* **Upload ≠ verification.** (Providing a photo of a receipt does not automatically verify the ledger.)
* **Image ≠ proof by itself.** (It is evidence supporting a claim, not absolute truth.)
* **Audio preserves declaration, not absolute truth.** (A voice note captures what was said, not necessarily what is legally binding.)
* **Art preserves expression, not factual certification.** (Used for campaigns and ministry.)
* **AI-assisted media must be explicitly labeled.** (To protect timeline integrity and consumer trust.)

## 4. MediaDocumentBinding (Contextual Linkage)
Media artifacts do not exist in a vacuum. They connect directly to:
* `Business Home` (Public visibility and identity)
* `Continuity Timeline` (Replay events)
* `Steward Media Draft` (Pending intent)
* `PDF/Scroll Templates` (As embedded evidence sections)

**Operational Examples:**
* **Financial Steward:** A funeral-cover agent uploads a `voice_note` → linked to a client opportunity → later supports a `Family Cover Proposal` Document → *Boundary: It does not automatically prove final agreement.*
* **Ministry Steward:** A sermon audio recording becomes `ministry_teaching` media → linked to a `Teaching Scroll` Document → preserved with date, speaker, and scripture → *Boundary: Not treated as absolute, infallible authority.*
* **Local Retail Steward:** A product photo becomes `catalogue` media → linked to `Business Home` → inserted into a `Specials Catalogue` PDF → *Boundary: Availability and pricing may change.*

## 5. Architectural Components to Build
Before any upload or rendering is implemented, the following backend/data registries must be established:
* `MediaArtifactRegistry`
* `MediaTypeRegistry`
* `MediaUsagePolicy`
* `MediaDocumentBinding`

---
*“Let the record show: Sensory continuity is now a governed, provenance-aware artifact in the Causal River.”*
