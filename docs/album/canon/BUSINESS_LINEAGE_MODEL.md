# iPhande Business Lineage Model

This document outlines the canonical model for classifying stewards and their economic activities on the iPhande platform. It establishes a clear, scalable, and doctrine-aligned structure for identity.

## The Three Layers of Business Identity

A steward's business identity is composed of three distinct, independent layers:

1.  **Lineage:** The fundamental economic pattern. It answers: *How does value flow?*
2.  **Category:** The specific work or service being performed. It answers: *What work is being done?*
3.  **Archetype:** The steward's natural mode of operation. It answers: *How does the steward operate?*

## The Complete Doctrine Stack

iPhande's identity and memory engine is built on this complete stack:

*   **ROLE:** Authority (What can you do on the platform?)
*   **VERIFICATION:** Trust Gate (Are you permitted to participate?)
*   **LINEAGE:** Economic Reality (How does value flow?)
*   **CATEGORY:** Specific Work (What exactly do you do?)
*   **ARCHETYPE:** Operating Style (How do you naturally operate?)
*   **EVIDENCE:** Proof (What evidence exists that this work happened?)
*   **TIMELINE:** Memory (What happened and in what order?)
*   **TRUST:** Derived Result (What confidence can be derived?)

This framework supports any type of steward without changing the core logic of the platform.

### Production Rule

We do **not** create a new lineage for every industry. A lineage represents a recurring economic process that can span multiple industries. This prevents the system from becoming messy and unscalable.

*   **Bad (Too Specific):** `PLUMBER`, `MECHANIC`, `FUNERAL_AGENT`
*   **Good (Economic Pattern):** `SERVICE_BUSINESS`, `REPAIR_MAINTENANCE`, `COMMISSION_BASED_SALES`

The category is used for the specific job title or service type.

### Database Implementation

This structure maps directly to the `Profile` model:

*   `business_line` = **Lineage** (e.g., `SOFTWARE_DEVELOPMENT`)
*   `business_category_key` = **Category** (e.g., `app_development`)
*   `archetype_key` = **Archetype** (e.g., `builder`)

---

## Core Proven Lineages (V1/V2)

This is the master list of recognized economic patterns.

### Economic Lineages

*   **`SERVICE_BUSINESS`**
    Work is requested, performed, proved, invoiced, and paid.

*   **`RETAIL_STOCK`**
    Goods are bought, stocked, sold, counted, and replenished.

*   **`COMMISSION_BASED_SALES`**
    Leads become quotes, applications, approvals, and commissions.

*   **`AGRICULTURE_PRODUCTION`**
    Inputs become crops/livestock, harvest, sales, and records.

*   **`TRANSPORT_LOGISTICS`**
    Trips, deliveries, mileage, fuel, proof of delivery, and payment.

*   **`CONSTRUCTION_PROJECT`**
    Materials, labour, milestones, inspections, invoices, and handover.

*   **`CONTENT_CREATOR`**
    Content, audience, engagement, offers, sales, and replay.

*   **`EDUCATION_TRAINING`**
    Learners, sessions, attendance, assessments, certificates, outcomes.

*   **`SOFTWARE_DEVELOPMENT`**
    Requirements, build work, releases, support, invoices, and proof.

*   **`PROFESSIONAL_SERVICES`**
    Consultation, advice, documents, deliverables, billing, and records.

*   **`REPAIR_MAINTENANCE`**
    Inspection, diagnosis, repair, parts, proof, and payment.

*   **`EVENTS_HOSPITALITY`**
    Booking, preparation, delivery, attendance, payment, and feedback.

*   **`MANUFACTURING_PRODUCTION`**
    Raw materials, production, quality checks, inventory, sales.

*   **`RENTAL_ASSET`**
    Asset listed, booked, used, returned, inspected, and paid.

*   **`HEALTH_WELLNESS`**
    Client intake, service session, progress notes, follow-up, payment.

*   **`CREATIVE_ARTISAN`**
    Commission, design, production, delivery, client approval, payment.

### Community & Stewardship Lineages

*   **`FAITH_GIVING`**
    Pledges, giving, support, distribution, accountability, and testimony.

*   **`COMMUNITY_CARE`**
    Needs, visits, support actions, evidence, follow-ups, and outcomes.

*   **`PUBLIC_COMMUNITY_SERVICE`**
    Community need, public listing, response, evidence, and continuity.

*   **`KNOWLEDGE_RESEARCH`**
    Question, source, analysis, finding, report, and preservation.

---

## The Evidence Model

The real power of iPhande is that it asks: *What evidence exists that this work happened?*

Every lineage eventually defines its own required evidence types. This allows the Trust Profile to become deterministic (e.g., Evidence Completeness = 82%, Continuity Score = 91% -> Trust Level = Established) derived from actual evidence patterns rather than manual entry.

### Example: COMMISSION_BASED_SALES
*   Lead
*   Quote
*   Application
*   Proof
*   Commission Record

### Example: REPAIR_MAINTENANCE
*   Inspection
*   Diagnosis
*   Repair Record
*   Parts Record
*   Before Photo
*   After Photo
*   Payment Proof

### Example: SOFTWARE_DEVELOPMENT
*   Requirement
*   Build Record
*   Release
*   Support Record
*   Invoice
*   Payment

---

## Example Mappings

*   **Mechanic:**
    *   **Lineage:** `REPAIR_MAINTENANCE`
    *   **Category:** `Vehicle Repair`
    *   **Archetype:** `Builder`

*   **Funeral Policy Agent:**
    *   **Lineage:** `COMMISSION_BASED_SALES`
    *   **Category:** `Funeral Policies`
    *   **Archetype:** `Connector`

*   **Global IT and Business Solutions:**
    *   **Lineage:** `SOFTWARE_DEVELOPMENT`
    *   **Category:** `App Development`
    *   **Archetype:** `Architect`

*   **Church Support Worker:**
    *   **Lineage:** `FAITH_GIVING`
    *   **Category:** `Community Support`
    *   **Archetype:** `Shepherd`
