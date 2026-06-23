# SANAS Demonstration Strategy & Roadmap (v1)

This document outlines the strategic pivot from bid-writing to building a **demonstrable dashboard** that proves the claims of the SANAS Compliance Kernel. It is based on the reality alignment assessment and prioritizes credibility and tangible proof over feature breadth.

---

## 1. Strategic Insight: The Core Differentiator is Mature

The reality assessment reveals a strong strategic position:

| Layer                    | Maturity   | Strategic Value |
| ------------------------ | ---------- | --------------- |
| SANAS Compliance Kernel  | High       | Very High       |
| Axionyx ERP Core         | Low-Medium | High            |
| iPhande Operations Layer | Low        | High            |

The hardest part—the governance and traceability foundation—is the strongest. This is a significant advantage over typical ERP vendors who add governance as an afterthought. Our narrative and demonstration must lead with this strength.

**Our story is not "we built a new ERP." It is "we built a governance-grade compliance and traceability platform that can operate as the foundation for SANAS ERP modernization."**

---

## 2. The Demonstrable Dashboard, Not the Beautiful One

The next step is not to build a comprehensive UI, but a targeted console where every widget proves a specific claim about the system's integrity. For SANAS evaluators, seeing is believing.

### 🏛️ Governance & Audit Monitoring Console v1

This console will be built *only* with capabilities that already exist in the SANAS Compliance Kernel.

#### Panel 1 — System Integrity
*   **Purpose:** Prove that the audit chain is healthy and verifiable.
*   **Display:**
    ```text
    Ledger Status: VALID
    Total Events: 5,241
    Last Verification: 2026-06-18 21:15
    Hash Chain: ✓ Valid
    Replay Test: ✓ Passed
    Recovery Test: ✓ Passed
    ```
*   **Data Source:** `GET /overview`, `GET /chain`

#### Panel 2 — Traceability Explorer
*   **Purpose:** Show that every single action is individually traceable and linked.
*   **Display:**
    ```text
    Event #1042
    Type: PROCUREMENT_APPROVED
    Actor: Finance Manager
    Timestamp: 2026-06-18 11:22
    Previous Hash: abc123...
    Hash: def456...
    Linked: ✓ YES
    ```
*   **Data Source:** `GET /chain`

#### Panel 3 — Recovery Demonstration
*   **Purpose:** Prove the system is reconstructible and resilient.
*   **Display:**
    ```text
    Pre-Recovery State
    ------------------
    Open Cases: 25
    Approved: 102

    Recovered State
    ---------------
    Open Cases: 25
    Approved: 102

    Status: ✓ MATCH
    ```
*   **Demonstrates:** Same history = same outcome.

#### Panel 4 — Compliance Evidence
*   **Purpose:** Speak the language of procurement and compliance, not just engineering.
*   **Display:**
    ```text
    PFMA Controls
    ✓ Active

    POPIA Controls
    ✓ Active

    ISO 27001 Logging
    ✓ Active

    ISO 17011 Traceability
    ✓ Active
    ```
*   **Note:** For the demo, these are placeholders that prove the *framework for compliance* exists.

#### Panel 5 — Breach Simulation
*   **Purpose:** The most powerful proof point: show that the system actively detects governance failure, not just records activity.
*   **Flow:**
    1.  A button: `Simulate Unauthorized Modification`
    2.  Calls the `POST /debug/tamper` endpoint.
    3.  Reloads data from `/chain`.
    4.  Displays the result:
    ```text
    Integrity Status: BROKEN

    Violation Detected: Event 1042
    Expected Hash: abc123...
    Actual Hash:   xyz999...
    ```

---

## 3. Revised Development Roadmap

This assessment leads to a more credible, phased roadmap.

### Phase A: Governance & Audit Monitoring Console
*   Build the demonstrable dashboard using the existing, mature Compliance Kernel.
*   **Outcome:** A tangible, verifiable proof of the core value proposition.

### Phase B: Accreditation Workflow Module
*   Focus on SANAS's actual mission. Build a single, complete workflow: Application → Review → Inspection → Evidence → Decision → Audit Trail.
*   **Outcome:** A convincing demonstration of domain-specific capability, which is more powerful than ten unfinished generic modules.

### Phase C: HR / Procurement / Assets
*   Add traditional ERP modules after the core accreditation workflow is proven.
*   **Outcome:** A complete ERP solution built on a foundation of proven governance.

---

## 4. Recommended File Structure

### Frontend (React)
```text
apps/web/src/features/governance-console/
│
├── pages/
│   └── GovernanceConsolePage.tsx
├── components/
│   ├── IntegrityPanel.tsx
│   ├── TraceabilityPanel.tsx
│   ├── RecoveryPanel.tsx
│   ├── CompliancePanel.tsx
│   └── BreachSimulationPanel.tsx
├── services/
│   └── governanceApi.ts
└── types/
    └── governance.ts
```

### Backend (Existing `governance-dashboard` service)
The existing endpoints (`/overview`, `/chain`, `/debug/tamper`) are sufficient for V1 of the console. No new backend development is required for the initial demonstration.
