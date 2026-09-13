# Master Gap Register

| ID | Category | Finding | Evidence | Severity | Affected Surface | Current State | Expected State | Recommended Action |
|---|---|---|---|---|---|---|---|---|
| GAP-001 | Frontend | Missing Commercial Workflows | `iphande-v1-core-app` has no pages | P0 | Web App | MISSING | Complete Quote-to-Cash UI | Build Next.js workflow pages |
| GAP-002 | Authentication | Missing Auth UI | No login/register pages | P0 | Web App | MISSING | Login/Registration flows | Implement Supabase Auth UI |
| GAP-003 | Legal | Missing Terms & Privacy | No legal documents or consent tracking | P1 | Web App & API | MISSING | Versioned terms and consent | Draft docs and add consent schema |
| GAP-004 | Developer | Missing Developer Portal | No UI to manage API keys | P2 | Web App | MISSING | Developer dashboard | Build API key management UI |
| GAP-005 | Education | Missing Academy | No education domain logic or UI | P4 | Full System | MISSING | Business education platform | Postpone until core product is stable |
| GAP-006 | Housekeeping | Archived Mobile Apps | `archive_apps/` contains stale code | P3 | Repository | DEAD_OR_UNUSED | Clean repository | Delete `archive_apps/` |
