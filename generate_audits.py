import os

audit_dir = "docs/audits"
os.makedirs(audit_dir, exist_ok=True)

audits = {
    "full_system_audit.md": """# Full System Audit

## Overview
The iPhande system currently exhibits a massive disparity between a highly developed, certified backend and an almost completely absent frontend surface. 

## Frontend
- **Web App**: The `iphande-v1-core-app` (Next.js) is a nascent shell containing only a layout, a single page, and primitive components (`Button`, `TruthInput`, `Card`). It contains no commercial workflows.
- **Mobile Apps**: Several React Native/Expo apps exist (`archive_apps/mobile`, `mobile-modern`, `mobile-v1`, `mobile-app`). The active `mobile-app` is mostly empty scaffolding (`explore.tsx`, `index.tsx`). The older `archive_apps/mobile` contains many screens but is explicitly archived.

## Backend
- **API**: A robust FastAPI backend exists in `api/src` with extensive domain logic (`payment_engine`, `trust_engine`, `lifecycle_engine`, `ledger_safety_service`).
- **Database**: The database schema is fully managed by Alembic and contains extensive commercial modeling (`quote`, `invoice`, `payment_intent`, `earning_ledger`).
- **Status**: The backend is certified for 6F.7 Operational Readiness, but operates in a vacuum without client consumption.

## Conclusion
The system is functionally a headless API. The product surface is missing.
""",
    "page_surface_inventory.md": """# Page Surface Inventory

## Findings
The repository lacks a coherent set of active frontend pages. The Next.js web application (`iphande-v1-core-app`) contains only `app/page.tsx`. The mobile applications in `mobile-app` contain only primitive scaffolding.

### Page Matrix
| Surface | Route | Intended User | Exists | Complete | Backend Support | Navigation | Auth | Status |
| ------- | ----- | ------------- | ------ | -------- | --------------- | ---------- | ---- | ------ |
| Public Home | `/` | Anonymous | Yes | No | N/A | None | No | PARTIALLY_IMPLEMENTED |
| Quote Acceptance | TBD | Client | No | No | Yes | None | TBD | MISSING |
| Payment Checkout | TBD | Client | No | No | Yes | None | TBD | MISSING |
| Business Dashboard | TBD | Business | No | No | Yes | None | Yes | MISSING |
| Admin Dashboard | TBD | Admin | No | No | Yes | None | Yes | MISSING |
| Developer Portal | TBD | Developer | No | No | Yes | None | Yes | MISSING |

**Evidence**: `iphande-v1-core-app/app/` directory contents.
""",
    "role_capability_matrix.md": """# Roles & Permissions Audit

## Discovered Roles
Based on the database schema (`api/src/models/`) and backend logic:
- **Business Owner / Merchant**: Possesses a `MerchantAccount`, issues quotes, receives payments.
- **Customer / Client**: Receives quotes, makes payments.
- **Steward / Admin**: Internal operators with elevated access.
- **Developer / System (S2S)**: RS256 `kid` based authentication for backend-to-backend integrations.

## Matrix
| Capability | Business Owner | Customer | Steward | System |
| ---------- | -------------- | -------- | ------- | ------ |
| Issue Quotes | Yes | No | No | No |
| Pay Invoices | No | Yes | No | No |
| Access Ledgers | Yes (Own) | No | Yes (All) | No |
| Issue S2S Tokens | No | No | No | Yes |

**Gap**: The frontend has no role-based routing or authentication guards implemented.
""",
    "product_capability_matrix.md": """# Product Capability Matrix

| Capability | Backend | Frontend | Navigation | Auth | Tenant Isolation | Tests | Docs | Legal | Status |
| ---------- | ------: | -------: | ---------: | ---: | ---------------: | ----: | ---: | ----: | ------ |
| Identity / JWT | Yes | No | No | Yes | Yes | Yes | Yes | No | PARTIALLY_IMPLEMENTED |
| Quote to Cash | Yes | No | No | N/A | Yes | Yes | Yes | No | PARTIALLY_IMPLEMENTED |
| Ledger Accounting | Yes | No | No | N/A | Yes | Yes | Yes | No | PARTIALLY_IMPLEMENTED |
| Concurrency Guards | Yes | N/A | N/A | N/A | Yes | Yes | Yes | N/A | IMPLEMENTED |
| Education / Academy | No | No | No | No | No | No | No | No | MISSING |
| Developer API | Yes | No | No | Yes | Yes | Yes | Yes | No | PARTIALLY_IMPLEMENTED |
""",
    "navigation_audit.md": """# Navigation & Information Architecture Audit

## Findings
- **Status**: MISSING
- **Evidence**: There is no global navigation component in `iphande-v1-core-app`. There is no routing structure mapping to the extensive backend commercial workflows.
- **Proposed Architecture**:
  - `/` (Home)
  - `/auth/login` (Authentication)
  - `/dashboard` (Business Owner entry)
  - `/quotes/[id]` (Public-facing quote view for clients)
  - `/payments/checkout/[id]` (Payment flow)
  - `/developer` (API documentation and keys)
""",
    "legal_surface_audit.md": """# Legal & Trust Surface Audit

## Findings
- **Status**: MISSING
- **Evidence**: No files matching `terms`, `privacy`, `cookie`, or `acceptable_use` exist in the web frontend or documentation.
- The database does not appear to contain a `LegalAcceptance` table or similar mechanism for tracking user consent to terms of service.
- **Dependencies**: Legal documents must be drafted, and an acceptance component must be built and bound to user registration.
""",
    "developer_surface_audit.md": """# Developer Surface Audit

## Findings
- **Backend Capabilities**: IMPLEMENTED. The API supports RS256 dual-key rotation, idempotency, trace IDs, and webhook/event mechanisms.
- **Developer Product Surface**: BACKEND CAPABILITY WITHOUT DEVELOPER PRODUCT SURFACE.
- **Evidence**: There is no Developer Portal, API key management UI, or webhook configuration dashboard in the web or mobile applications.
- **Documentation**: An `openapi.json` is generated, but there is no public-facing API reference website.
""",
    "education_system_audit.md": """# Education System Audit

## Findings
- **Status**: MISSING
- **Evidence**: Extensive searches for `education`, `academy`, `course`, `lesson`, and `tutorial` yield no UI or backend domain logic.
- While there are `content_templates` and `scripture_seeds` for contextual messaging, there is no formal Learning Management System (LMS) or business education capability.
- **Recommendation**: Do not implement until the core commercial lifecycle is surfaced to users.
""",
    "api_frontend_contract_audit.md": """# API / Frontend Contract Audit

## Findings
- **Status**: INCONSISTENT / MISSING
- **Evidence**: The frontend does not consume the backend APIs. There are no generated API clients, no `fetch` or `axios` services mapping to the `/quotes`, `/payments`, or `/financial_events` routers.
- The contract is purely theoretical until the frontend begins integrating with the API.
""",
    "security_surface_audit.md": """# Security Surface Audit

## Findings
- **Authentication**: JWT validation and RS256 verification are robustly implemented in the backend (Certified 6F.7.1).
- **Tenant Isolation**: Implemented and certified (6F.7.3).
- **CORS/CSRF**: The FastAPI application has CORS middleware, but specific origins for production need strict auditing. CSRF protection for session-based auth is not visible since the frontend uses an unknown auth mechanism (likely token-based).
- **Input Validation**: Pydantic schemas enforce strict typing.
- **Status**: Backend is secure; Frontend security posture is UNKNOWN_REQUIRES_REVIEW once built.
""",
    "production_surface_audit.md": """# Production Surface Audit

## Findings
- **Status**: PARTIALLY_IMPLEMENTED
- **Evidence**: The backend is proven to start hermetically (`test_6F7_6_deployment_determinism.py`). Dockerfiles, Railway configurations (`railway.toml`), and environment examples exist.
- **Missing**: There is no production deployment mechanism for the Next.js frontend (`iphande-v1-core-app`), nor is there an ingress/reverse-proxy configuration uniting the API and the web frontend under a single domain.
""",
    "dead_code_orphan_audit.md": """# Dead-Code & Orphan Audit

## Findings
- **Archive Apps**: `archive_apps/mobile`, `archive_apps/mobile-modern`, `archive_apps/mobile-v1` are dead code and should be removed from the active working tree to reduce clutter.
- **Orphan APIs**: Nearly all `api/src/routers` are orphaned because no frontend consumes them.
- **Recommendation**: Delete the `archive_apps` directory in the next milestone. Maintain the APIs as the frontend will be built to consume them.
""",
    "MASTER_GAP_REGISTER.md": """# Master Gap Register

| ID | Category | Finding | Evidence | Severity | Affected Surface | Current State | Expected State | Recommended Action |
|---|---|---|---|---|---|---|---|---|
| GAP-001 | Frontend | Missing Commercial Workflows | `iphande-v1-core-app` has no pages | P0 | Web App | MISSING | Complete Quote-to-Cash UI | Build Next.js workflow pages |
| GAP-002 | Authentication | Missing Auth UI | No login/register pages | P0 | Web App | MISSING | Login/Registration flows | Implement Supabase Auth UI |
| GAP-003 | Legal | Missing Terms & Privacy | No legal documents or consent tracking | P1 | Web App & API | MISSING | Versioned terms and consent | Draft docs and add consent schema |
| GAP-004 | Developer | Missing Developer Portal | No UI to manage API keys | P2 | Web App | MISSING | Developer dashboard | Build API key management UI |
| GAP-005 | Education | Missing Academy | No education domain logic or UI | P4 | Full System | MISSING | Business education platform | Postpone until core product is stable |
| GAP-006 | Housekeeping | Archived Mobile Apps | `archive_apps/` contains stale code | P3 | Repository | DEAD_OR_UNUSED | Clean repository | Delete `archive_apps/` |
"""
}

for filename, content in audits.items():
    with open(os.path.join(audit_dir, filename), "w", encoding="utf-8") as f:
        f.write(content)

print("Audit documents generated successfully.")
