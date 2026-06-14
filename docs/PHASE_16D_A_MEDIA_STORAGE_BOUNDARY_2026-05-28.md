# PHASE 16D-A: Media Storage Boundary

**Date:** 2026-05-28

## Where Media Is Stored
- Media files are stored on the backend server filesystem under a dedicated directory (e.g., `media/` or `media/continuity/`).
- Each file is saved with a unique, non-colliding identifier (media_id) as its filename, preserving the original extension.

## Naming Conventions
- Filenames: `<media_id>.<ext>` (e.g., `a1b2c3d4e5f6.jpg`)
- No user-supplied or semantic names.
- No destructive renaming or overwriting.

## Replay Guarantees
- Every uploaded media file is retrievable by its media_id.
- The original file is served unmodified for replay.
- Media URL is returned on upload and is stable for replay.

## Retention Philosophy
- Media is preserved as long as the associated continuity capture exists.
- No silent deletion or garbage collection at this phase.
- Explicit deletion (if ever needed) must be steward-initiated and auditable.

## Non-Destructive Doctrine
- No compression, resizing, or metadata stripping on upload.
- No format conversion.
- No silent mutation of original evidence.

> “Media preservation must never silently mutate original evidence.”

## Future Migration Posture
- Filesystem storage is acceptable for initial implementation.
- Future migration to cloud/object storage must guarantee non-destructive transfer and stable replay URLs.
- Migration must never overwrite or lose original evidence.

---

This boundary ensures that iPhande's media continuity infrastructure is built on trust, transparency, and faithful evidence preservation—never silent mutation or erasure.
