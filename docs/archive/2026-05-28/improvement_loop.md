# iPhande Improvement Loop

## Purpose
Ensure all feedback, issues, audits, and corrective actions result in lasting improvement and preserved history.

---

## ImprovementNote Fields
- id
- title
- reason
- improvement_type: content_template, API_contract, UX_flow, privacy_control, replay_logic, documentation, other
- before_state
- after_state
- linked_issue_id (nullable)
- created_at

---

## Loop Steps
1. Feedback or audit triggers a Quality Issue.
2. Issue may trigger Corrective Action.
3. Resolution results in an Improvement Note.
4. Improvement is documented with before/after state.
5. History is preserved—no silent erasure.
6. Improvement loop is reviewed periodically.
