# iPhande Repo Audit Report: Python Files in docs/

**Date:** 2026-05-28

## Purpose
This audit documents the status and recommended actions for all Python (.py) files found in the `docs/` directory. The goal is to ensure all backend/domain logic resides in the appropriate backend folders (`api/src/`), and that `docs/` is reserved for documentation and markdown assets only.

**Update (28/05/2026):**
- All domain logic and schema Python files have been migrated to their correct locations in `api/src/`.
- All misplaced TSX files have been removed from `docs/` (see audits/tsx/audit_tsx_files_in_docs.md).
- The `docs/` folder now contains only documentation assets (.md files, images, etc.).

---

## 1. Python Files Found in docs/ (as of initial audit)

| File Name                          | Present in api/src/? | Notes / Purpose                                                      | Recommended Location                  |
|------------------------------------|----------------------|-----------------------------------------------------------------------|---------------------------------------|
| __init__.py                        | N/A                  | (boilerplate, can be deleted if not needed)                           | Remove or ignore                      |
| weaving_service.py                 | ❌                   | Document validation/orchestration logic                               | api/src/services/ or domain/validation |
| template_section_registry.py        | ❌                   | Section families, mutability, registry definitions                    | api/src/domain/registry/ or templates/ |
| replay_binding_schemas.py          | ❌                   | Artifact binding/event schemas                                        | api/src/domain/replay/ or schemas/     |
| registry_loaders.py                | ❌                   | Registry access logic                                                 | api/src/domain/registry/ or services/  |
| registry.py                        | ⚠️ (see below)       | Lineage registry, lookup functions                                    | api/src/data/content_templates/        |
| persistence_rendering_abstractions.py | ❌                | Rendering/persistence schemas                                         | api/src/domain/rendering/ or schemas/  |
| media_integrity_schemas.py         | ❌                   | Media integrity/preservation schemas                                  | api/src/schemas/ or domain/media/      |
| draft_hydration_pipeline.py        | ❌                   | Draft hydration logic                                                 | api/src/services/ or domain/validation |
| document_schemas.py                | ❌                   | Document/section/validation schemas                                   | api/src/schemas/                      |
| commission_based_sales.py          | ✅                   | Business logic/data                                                   | api/src/data/content_templates/        |
| archetype_standard_registry.py      | ❌                   | Archetype standards registry                                          | api/src/domain/registry/ or data/      |
| archetype_document_templates.py     | ❌                   | Archetype document templates                                          | api/src/domain/templates/ or data/     |

---

## 2. Key Findings (as of initial audit)

- **Most docs/*.py files do NOT exist in api/src/** and appear to be misplaced backend/domain logic.
- **commission_based_sales.py** and **registry.py** have equivalents in `api/src/data/content_templates/`.
- All other files are not present in the backend and should be migrated for proper separation of concerns.

---

## 3. Recommendations (as of initial audit)

1. **Migrate all domain, registry, validation, and schema logic from docs/ to api/src/**, using subfolders such as:
    - `api/src/domain/registry/`
    - `api/src/domain/validation/`
    - `api/src/domain/templates/`
    - `api/src/domain/replay/`
    - `api/src/domain/rendering/`
    - `api/src/schemas/`
    - `api/src/services/`
    - `api/src/data/content_templates/`
2. **Remove or ignore `__init__.py` in docs/** unless needed for a specific reason.
3. **Keep docs/ for markdown and documentation assets only.**
4. **Review for duplication:**
    - If a file exists in both docs/ and api/src/, keep only the canonical backend version.
    - For files with business logic/data (e.g., commission_based_sales.py), ensure only one canonical version exists in the backend.

---

## 4. Next Steps (as of initial audit)

- [ ] Review each file for code overlap/duplication before migration.
- [ ] Migrate files to the recommended backend folders.
- [ ] Update import paths and references as needed.
- [ ] Remove Python files from docs/ after migration is complete.

---

## 5. Final Verification (28/05/2026)

- All Python files containing backend/domain logic have been migrated to `api/src/`.
- All misplaced TSX files have been removed from `docs/`.
- `docs/` now contains only markdown documentation and related assets, as intended.
- No duplication of canonical logic remains between `docs/` and `api/src/`.

**Prepared by:** GitHub Copilot (GPT-4.1)

**Session context:** Full repo hygiene and domain logic audit, 28/05/2026.
