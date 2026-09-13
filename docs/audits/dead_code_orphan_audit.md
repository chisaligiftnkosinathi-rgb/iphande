# Dead-Code & Orphan Audit

## Findings
- **Archive Apps**: `archive_apps/mobile`, `archive_apps/mobile-modern`, `archive_apps/mobile-v1` are dead code and should be removed from the active working tree to reduce clutter.
- **Orphan APIs**: Nearly all `api/src/routers` are orphaned because no frontend consumes them.
- **Recommendation**: Delete the `archive_apps` directory in the next milestone. Maintain the APIs as the frontend will be built to consume them.
