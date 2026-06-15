# Production Hardening Sprint Checklist

This is the strict execution order for the V1 hardening sprint.

## Sprint Order
- [ ] **1. Creator Proof Environment:** Ensure admin/business access, seeded `TECH_DIGITAL_ARCHETYPE_V1` data, and documents/media ready for `glegacy97@gmail.com`.
- [ ] **2. Public Landing Page:** Implement the outer home page according to `PUBLIC_HOME_PAGE_SPEC.md`.
- [ ] **3. Media Upload Engine:** Set up Supabase Storage for images and documents.
- [ ] **4. Opportunity Images:** Update schema (`title`, `description`, `image_1`, `image_2`, `category`, `location`, `contact_method`, `expiry_date`), UI, and backend.
- [ ] **5. Advertisement Images:** Update schema (`title`, `description`, `image_1`, `image_2`, `category`, `location`, `contact_method`, `expiry_date`), UI, and backend.
- [ ] **6. Archetype Template Seeding:** Inject service templates into the DB.
- [ ] **7. Dashboard Hardening:** Polish creator business dashboard and verify freemium locks.
- [ ] **8. Document Engine Hardening:** Implement ReportLab templates for Quotes, Invoices, Proofs, etc.
- [ ] **9. Simulation:** Execute the entire `Lead → Quote → Project → Proof → Invoice → Receipt → Portfolio` loop for Global IT.
- [ ] **10. Pilot Launch:** Push V1 to production.

## Rule of Engagement
Do not add scattered features. Follow this exact order.
We are building continuity and stability.
