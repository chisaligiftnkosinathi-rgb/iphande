# Profile Uniqueness Constraint Validation

- **Objective:** Ensure duplicate emails are blocked by DB constraint
- **Endpoint:** POST /api/v1/profiles
- **Payload:**
  - { "email": "gift@example.com", ... }
- **Expected Result:**
  - 400/422/409 error, UNIQUE constraint failed
- **Actual Result:**
  - 500 Internal Server Error
  - UNIQUE constraint failed: profiles.email
- **Errors Observed:**
  - Duplicate email correctly blocked by DB
- **Corrective Action:**
  - None needed; constraint is enforced
- **Final Status:**
  - PASS (Healthy Failure)
- **Verification Date:** 2026-05-21
