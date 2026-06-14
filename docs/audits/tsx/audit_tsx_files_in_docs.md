# iPhande Repo Audit Report: TSX Files in docs/

**Date:** 2026-05-28

## Purpose
This audit documents the status and actions taken regarding all React Native (.tsx) files found in the `docs/` directory. The goal is to ensure all UI code resides in the appropriate mobile app folders, and that `docs/` is reserved for markdown and documentation assets only.

---

## 1. TSX Files Found in docs/

| File Name                  | Status      | Canonical Location                |
|---------------------------|-------------|-----------------------------------|
| WisdomCard.tsx            | Removed     | mobile/components/ui/WisdomCard.tsx|
| TruthCard.tsx             | Removed     | mobile/components/ui/TruthCard.tsx |
| StewardQuickActions.tsx   | Removed     | mobile/components/ui/ (or features)|
| StewardButton.tsx         | Removed     | mobile/components/ui/StewardButton.tsx|
| RealityBoundary.tsx       | Removed     | mobile/components/ui/ (or features)|
| OpportunityQuickActions.tsx| Removed    | mobile/components/ui/ (or features)|
| ContinuityMeta.tsx        | Removed     | mobile/components/ui/ (or features)|
| EvidenceGapCard.tsx       | Removed     | mobile/components/ui/ (or features)|

---

## 2. Key Findings

- All TSX files in docs/ were misplaced UI components, likely created during prototyping.
- Canonical, up-to-date versions exist in mobile/components/ui/ or mobile/src/features/.
- All TSX files have now been removed from docs/.
- The docs/ folder now contains only markdown (.md) and documentation assets, as intended.

---

## 3. Recommendations

- Continue to keep docs/ for documentation only.
- All UI code should be maintained in the mobile/ folder structure.
- If prototyping, move finalized components to their canonical location and remove from docs/.

---

**Prepared by:** GitHub Copilot (GPT-4.1)

**Session context:** Repo hygiene and UI code audit, 28/05/2026.
