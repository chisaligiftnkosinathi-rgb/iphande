# iPhande End-to-End Production Readiness Audit

## Purpose
This document tracks the final production readiness audit for iPhande. A feature is only marked complete when a human has successfully executed the end-to-end flow and recorded the evidence. The goal is to prove that the complete customer-to-steward journey works reliably.

---

## Executive Summary

| Flow | Status | Tested By | Date | Notes |
|---|:---:|---|---|---|
| Phase 1: Registration | ⬜ | | | |
| Phase 2: Activation | ⬜ | | | |
| Phase 3: Profile Setup | ⬜ | | | |
| Phase 4: Directory Search | ⬜ | | | |
| Phase 5: Public Profile | ⬜ | | | |
| Phase 6: Lead Creation | ⬜ | | | |
| Phase 7: Quote Creation | ⬜ | | | |
| Phase 8: Proof Upload | ⬜ | | | |
| Phase 9: Timeline | ⬜ | | | |
| Phase 10: Axionyx Verification | ⬜ | | | |

---

## Phase 1: Authentication

**Goal:** Ensure a steward can create and securely access their account.

- [ ] User can create an account (Email/Password).
- [ ] Phone registration operates correctly (if supported).
- [ ] Duplicate account creation is handled gracefully.
- [ ] Password reset flow operates end-to-end.
- [ ] User can log in and session persists correctly.

**Evidence / Notes:**
> *Record test accounts used and any observed latency or errors here.*

---

## Phase 2: Activation

**Goal:** Verify the business rule that a steward must pay R120 to pass the `StewardGate` into the ecosystem.

- [ ] Activation screen (`/activation/index`) loads correctly for new users.
- [ ] R120 Verification payment flow works (or manual review flow succeeds).
- [ ] Steward profile status updates correctly upon payment/review.
- [ ] `StewardGate` unlocks and grants access to the main application tabs.

**Evidence / Notes:**
> *Record payment/review mechanism used to bypass gate during testing.*

---

## Phase 3: Profile Creation

**Goal:** Ensure a steward can build a comprehensive digital identity.

- [ ] Steward can input Name, Business Name, Location, and Contact Number.
- [ ] Steward can successfully select an Archetype (Trade).
- [ ] Profile data persists correctly to the backend upon saving.
- [ ] A unique `slug` is generated.
- [ ] Steward can toggle profile to "Public" (`is_public = true`).

**Evidence / Notes:**
> *Record slug of test profile.*

---

## Phase 4: Public Discovery

**Goal:** Verify a customer can discover the steward without needing a direct link.

- [ ] Directory (`/public/index.tsx`) loads correctly.
- [ ] Customer can search by Trade (Archetype).
- [ ] Customer can search by City/Province.
- [ ] Empty results are handled gracefully.
- [ ] Steward appears in results with correct "Verified" badge and details.

**Evidence / Notes:**
> *Record search parameters used to find test profile.*

---

## Phase 5: Public Profile

**Goal:** Verify the steward's public landing page converts attention into action.

- [ ] Profile (`/public/[slug].tsx`) loads correctly via directory click-through.
- [ ] Logo and background images load without error.
- [ ] Proof of Work gallery renders items chronologically.
- [ ] "Contact via WhatsApp" correctly formats and opens WhatsApp.
- [ ] "Request Service" form submits without error.

**Evidence / Notes:**
> *Record load times and any UI clipping on physical mobile devices.*

---

## Phase 6: Lead Pipeline

**Goal:** Ensure customer requests instantly reach the steward.

- [ ] Customer submits "Request Service".
- [ ] Backend creates a `Lead` (or `QuoteRequest`).
- [ ] Lead automatically appears in the steward's "Leads" tab.
- [ ] Steward receives a notification (if implemented).

**Evidence / Notes:**
> *Record time from customer submission to lead appearing in dashboard.*

---

## Phase 7: Quote Pipeline

**Goal:** Ensure a steward can respond to a lead with a formal quote.

- [ ] Steward converts Lead into a Quote.
- [ ] Quote generates a secure shareable link/PDF.
- [ ] Quote status tracks correctly (Draft -> Sent -> Accepted).
- [ ] Customer can view/respond to the quote.

**Evidence / Notes:**
> *Record quote link and PDF generation success.*

---

## Phase 8: Proof Of Work

**Goal:** Ensure completed jobs can be documented for future trust.

- [ ] Steward can upload a photo of completed work.
- [ ] Steward can add a description/note to the photo.
- [ ] Proof attaches to the correct job/profile.
- [ ] Proof instantly displays on the public profile.

**Evidence / Notes:**
> *Record image upload speed and file size constraints.*

---

## Phase 9: Continuity

**Goal:** Ensure every major action weaves into the steward's timeline.

- [ ] Lead Received creates a `Continuity Event`.
- [ ] Quote Sent creates a `Continuity Event`.
- [ ] Work Completed/Proof Uploaded creates a `Continuity Event`.
- [ ] Events render sequentially on the Steward's Timeline tab.

**Evidence / Notes:**
> *Record timeline state.*

---

## Phase 10: Axionyx Bridge

**Goal:** Ensure the external governance loop validates iPhande events.

- [ ] Continuity Event passes through the `Continuity Handshake`.
- [ ] Event reaches Axionyx.
- [ ] Axionyx processes and returns a cryptographically signed receipt.
- [ ] Receipt is stored correctly in iPhande and displayed in the Timeline.

**Evidence / Notes:**
> *Record transaction ID or receipt block from the test handshake.*

---

## Production Readiness Checklist

### Security
- [ ] Authentication tested against brute force.
- [ ] Public routes tested for data leakage.
- [ ] File upload limits (size/type) enforced on Proof of Work and Profile Photos.

### Reliability
- [ ] Backend restart recovery verified.
- [ ] Railway (or current host) deployment scripts validated.
- [ ] Database backup strategy active and tested.

### User Experience
- [ ] No dead links across the app.
- [ ] No blank screens during loading states.
- [ ] Safe area insets tested on iOS/Android (no broken navigation).

### Monitoring
- [ ] Login failures are logged.
- [ ] Lead/Quote creation errors trigger alerts.
- [ ] Payment/Activation failures are logged.
