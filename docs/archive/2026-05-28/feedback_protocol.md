# iPhande Feedback Protocol

## Purpose
Structure all feedback (bugs, content quality, privacy, features, UX, etc.) for actionable improvement.

---

## Feedback Types
- bug
- content_quality
- privacy_concern
- feature_request
- user_experience
- other

---

## Feedback Fields
- id
- owner_profile_id (nullable)
- feedback_type
- source: user, admin, tester, system
- message
- severity: low, medium, high, critical
- status: new, reviewed, linked_to_issue, closed
- created_at
- updated_at

---

## Protocol
1. All feedback is logged with status 'new'.
2. Feedback is reviewed and triaged.
3. If actionable, link to a Quality Issue.
4. Status updated as feedback is processed.
5. Feedback is never deleted—history is preserved.
6. Feedback outcomes are communicated to originators when possible.
