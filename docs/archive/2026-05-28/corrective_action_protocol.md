# iPhande Corrective Action Protocol

## Purpose
Track and resolve issues, risks, and doctrine violations through structured corrective actions.

---

## CorrectiveAction Fields
- id
- issue_id
- action_summary
- root_cause
- correction
- prevention
- owner
- due_date (nullable)
- status: planned, in_progress, completed, verified
- created_at
- updated_at

---

## Protocol
1. Each major issue or audit finding triggers a corrective action.
2. Actions are assigned to an owner and tracked to closure.
3. Status is updated as work progresses.
4. Root cause and prevention are documented.
5. Closure is verified by audit or review.
6. All actions are preserved for history.
