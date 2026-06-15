# iPhande V1 Screen & API Route Audit

This document records the audit of every active route inside `app/`, verifying its purpose, target audience, backing API endpoints, current status, and actions needed.

| File / Route | Screen Name | User Type | Purpose | Backing API Endpoint(s) | Status | Action Needed |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `app/index.tsx` | Welcome Landing | Public Visitor | Entrypoint, onboarding introduction | None | Working | Remove references to "free activation" and "automated invoicing" |
| `app/auth/login.tsx` | Login | Steward / Admin | Authenticate steward session | Supabase Auth `signInWithPassword` | Working | None |
| `app/auth/register.tsx` | Register | Public Visitor | Register new steward account | Supabase Auth `signUp`, `/profiles/bootstrap` | Working | None |
| `app/activation/index.tsx` | Activation | Steward | Block access until activated | None (routing helper) | Working | Ensure Platform Creator bypasses the payment block |
| `app/onboarding/index.tsx` | Business Setup | Steward | Collect initial profile metadata | `PATCH /profiles/me` | Working | None |
| `app/payment-verification.tsx` | Payment Verification | Steward | Banking info, receipt upload | `GET /profiles/me/payment-status`, `POST /profiles/me/payment-proof` | Partially Wired | Restyle background to match standard light theme. Connect to `refreshProfile` on upload |
| `app/upgrade.tsx` | Upgrades | Steward | View premium plan options | None (simulated alert) | Stub | Restyle background to conform to brand design |
| `app/tabs/home.tsx` | Home / Summary | Steward / Creator / Admin | Today's summary, quick dashboard access | `GET /leads/me`, `GET /opportunities`, `GET /continuity-events/business/${id}` | Working | Show Platform Creator stats banner. Wire all available tools in grid |
| `app/tabs/index.tsx` | Opportunities Feed | Steward | Search opportunities and advertisements | `GET /opportunities`, `GET /advertisements/active`, `POST /opportunities` | Working | None |
| `app/tabs/leads.tsx` | Leads Manager | Steward | Manage customer contact pipeline | `GET /leads/me`, `PATCH /leads/${id}` | Working | None |
| `app/tabs/visibility.tsx` | Visibility Health | Steward | Profile completeness rating | `GET /profiles/me` | Working | None |
| `app/tabs/timeline.tsx` | Timeline | Steward | Verifiable Continuity Ledger feed | `GET /continuity-events/business/${id}` | Working | None |
| `app/tabs/profile.tsx` | Profile Tab | Steward / Creator / Admin | Account settings entrance, logout | None | Working | Display Platform Identity, Access Level, System Responsibilities. Route Admin to `/admin` |
| `app/profile/settings.tsx` | Settings | Steward | Edit phone, WhatsApp, GPS location, logo URL | `PATCH /profiles/me` | Working | None |
| `app/admin/index.tsx` | Admin Dashboard | Admin / Creator | Platform Overview counts and portals | `GET /api/v1/admin/dashboard` | Working | Link to referrals & ads reviews (`/admin/payments`) |
| `app/admin/payment-proofs.tsx` | Payment Proofs | Admin / Creator | Verify receipts and activate stewards | `GET /api/v1/admin/profiles/payment-proofs`, `POST /api/v1/admin/profiles/${id}/approve-payment`, `POST /api/v1/admin/profiles/${id}/reject-payment` | Working | None |
| `app/admin/payment-reviews.tsx` | Payment Reviews | Admin / Creator | Verify receipts (Duplicate) | `/admin/payment-reviews` | Broken/Stub | Remove file / hide route |
| `app/admin/payments.tsx` | Control Room | Creator | Approve referrals and advertisements | `GET /admin/referrals/pending`, `PATCH /admin/referrals/${id}/pay`, `GET /admin/advertisements/pending` | Working | Link from Admin Dashboard, restrict demotion of Creator |
| `app/admin/users.tsx` | User Management | Admin / Creator | List users, promote/demote | `GET /api/v1/admin/users`, `POST /api/v1/admin/users/${id}/promote-admin`, `POST /api/v1/admin/users/${id}/demote-admin` | Working | None |
| `app/admin/vba-console.tsx` | VBA Console | Admin / Creator | Visual Business Architecture overview | `GET /api/v1/admin/dashboard` | Working | None |
| `app/public/explore.tsx` | Explore Services | Public / Customer | Browse service opportunities | `GET /api/v1/public/opportunities` | Working | None |
| `app/public/[slug].tsx` | Public Profile | Public / Customer | Steward profile and timeline ledger | `GET /public/${slug}`, `POST /leads` | Working | None |
| `app/public/advertise.tsx` | Post Ad | Customer | Post R2.50 community ad | `POST /api/v1/advertisements` | Working | None |
| `app/opportunities/new.tsx` | New Opportunity | Customer | Post service needs | `POST /api/v1/opportunities` | Working | None |
| `app/quotes/index.tsx` | Quotes | Steward | View quotes | `GET /quotes/me` | Working | None |
| `app/quotes/new.tsx` | New Quote | Steward | Quote builder modal | `POST /quotes` | Working | None |
| `app/quotes/[id].tsx` | Quote Detail | Steward | Quote/invoice PDF rendering | `GET /quotes/me`, `POST /invoices/from-quote/${id}` | Working | None |
| `app/jobs/[id]/proof.tsx` | Job Proof | Steward | Record job completion proof | `POST /continuity-events/` | Working | None |
| `app/expenses/index.tsx` | Expenses | Steward | Log business expenses | `GET /expenses/me`, `POST /expenses` | Working | None |
| `app/tools/calculator.tsx` | Quote Builder | Steward | Detailed service calculator | `POST /quotes` | Working | None |
| `app/tools/documents.tsx` | Documents Tracker | Steward | Saved quotes and documents | `GET /quotes/business/${id}` | Working | None |
| `app/tools/inventory-tracker.tsx` | Inventory Tracker | Steward | Record material stock | `POST /continuity-events/` | Working | None |
| `app/tools/km-tracker.tsx` | Mileage Tracker | Steward | Log vehicle mileage | `POST /continuity-events/` | Working | None |
| `app/tools/notebook.tsx` | Notebook | Steward | Record quick text notes | `POST /continuity-events/` | Working | None |
| `app/tools/proof-of-work.tsx` | Proof of Work | Steward | Save completed job to timeline | `POST /continuity-events/` | Working | None |
| `app/tools/referrals.tsx` | Referrals | Steward | Refer community stewards | `GET /referrals/me` | Working | None |
| `app/support/index.tsx` | Support Index | Steward | Help docs | None | Working | None |
| `app/support/giving.tsx` | Voluntary Giving | Steward | Platform donations | None | Working | None |
| `app/legal/index.tsx` | Legal Index | Steward | Terms of service | None | Working | None |
| `app/legal/privacy.tsx` | Privacy Policy | Steward | Privacy terms | None | Working | None |
| `app/legal/acknowledgements.tsx` | Acknowledgements | Steward | Attributions | None | Working | None |
