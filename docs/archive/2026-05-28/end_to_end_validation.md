# iPhande End-to-End Validation

## V1 Pass/Fail Criteria

- [ ] No 500 errors in demo flow
- [ ] Public coordinates hidden when location_is_public=false
- [ ] Generated content returns title/body/CTA/share links
- [ ] Opportunities create timeline replay
- [ ] Followups can be completed
- [ ] Business categories are documented
- [ ] Known issues updated before mobile work begins

---

## Minimum Stable Loop

1. Profile →
2. Public profile →
3. Generate content →
4. Create opportunity →
5. Add timeline →
6. Create followup →
7. Complete followup

---

## Validation Steps
- Run all API test plan steps in Swagger
- Record pass/fail for each
- Update known_issues.md with any blockers
- Only proceed to mobile when all above are PASS
