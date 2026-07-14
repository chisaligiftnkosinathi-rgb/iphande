# Business Knowledge Scrolls

**Archive class:** `PROTECTED` / `DOMAIN-OBSERVATION`  

## Universal Truth vs. Individual Experience
The `business-knowledge` directory works in tandem with the `company-scrolls` directory. 
- **Company Scrolls** capture the unique, lived experience of a specific business.
- **Business Knowledge Scrolls** capture universal, legal, and operational truths that apply to all companies (e.g., CIPC compliance, SARS tax structures, labor laws).

> **Guiding Principle:** By separating general truth from individual experience, we build a disciplined domain model where foundational rules govern the system, and individual experiences shape the features.

## The South African Business Ecosystem
We are **mapping**, not documenting every law. Phanda doesn't need to become a legal encyclopedia. It needs to understand **how these pieces connect**.

```text
South African Business Ecosystem

Layer 1 — Constitutional & Legal Foundation
• Constitution, Company law, Contract law

Layer 2 — Business Identity
• CIPC (Mission 000)

Layer 3 — Revenue & Tax
• SARS (Mission 001)

Layer 4 — Financial System
• Banks, Payment systems (Mission 002)

Layer 5 — Employment
• Labour, UIF, Compensation Fund (Mission 003)

Layer 6 — Trade & Procurement
• Public procurement, Supplier databases, Tenders (Mission 004)

Layer 7 — Industry Regulators
• Mining, Health, Finance, Transport, Energy, Agriculture, Laboratories, etc.

Layer 8 — Markets
• Customers, Suppliers, Competitors

Layer 9 — Growth
• Funding, Export, Innovation, Intellectual Property (Mission 005)
```

## The Principle of Practical Knowledge
The Business Knowledge Scrolls shouldn't answer every question. They should answer: **"Who is responsible for what?"**

- Need to register a company? → CIPC
- Need a tax number? → SARS
- Need to employ staff? → Labour ecosystem
- Need to bid for government work? → Procurement ecosystem

> **Explicit Scope Boundary:**  
> The mission is **not** to model the entire South African economy.  
> The mission is to model the **parts of the South African business ecosystem that influence the life cycle of a business.**

---

## The Life Events Architecture
We do not organize the domain exclusively around regulators (CIPC, SARS, etc.). Regulators are passive. Businesses are active. 

Instead, we organize around **Business Life Events**.

**Examples of Life Events:**
- Starting a business
- Hiring your first employee
- Opening a bank account
- Registering for tax (or VAT)
- Applying for a licence
- Winning your first tender

**The shift:** A business doesn't wake up thinking, *"Today I need a regulator."* It thinks, *"Today I need to hire my first employee."* The regulator is simply part of that life event. Phanda's architecture asks: **"What stage is your business entering?"** and guides the steward through the organizations, documents, and actions that matter for that stage.

## Taxonomy of Regulators
1. **Universal Regulators:** Encounters expected for almost all businesses (CIPC, SARS, Banking, Labour).
2. **Industry-Specific Regulators:** Niche compliance based on sector (Health, Construction, Transport, Mining, etc.). These will be added as specialized knowledge scrolls later.
