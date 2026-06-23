# SANAS Demonstration Acceptance Criteria

**Purpose:** To serve as the definitive checklist for the "Governance & Audit Monitoring Console" v1. The demonstration is considered complete only when every item on this list is demonstrably true and can be presented in under five minutes.

---

[ ] **Overview Endpoint Operational:** The `GET /overview` endpoint returns system health data.
[ ] **Chain Endpoint Operational:** The `GET /chain` endpoint returns the full, verifiable event ledger.
[ ] **Tamper Endpoint Operational:** The `POST /debug/tamper` endpoint successfully modifies a ledger event for demonstration purposes.
[ ] **Replay Verification Visible:** The console can show that state is reconstructible from the event history.
[ ] **Integrity Verification Visible:** The console can show that the hash chain is valid.
[ ] **Recovery Verification Visible:** The console can demonstrate that state is consistent after a simulated crash and recovery.
[ ] **Compliance Panel Visible:** The UI panel for compliance control mapping is present (even with placeholder data).
[ ] **Breach Simulation Demonstrable:** The full tamper-detection-verification cycle is visible and proves the system's self-healing/self-auditing capability.
[ ] **Demo Executable in Under 5 Minutes:** The entire demonstration flow is concise and impactful.
