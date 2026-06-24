# iPhande Field Test Script (Version 1.0)

## Objective
To validate a single end-to-end economic loop:
> A customer discovers a steward → contacts them → requests service → steward receives it → conversation begins.

**Success is ONE completed loop.**
Not ten. Not perfect UX. One real match.

---

## ROLES
### 1. Steward (Service Provider)
A real person who offers a service (plumber / electrician / cleaner / caterer / transport). Represents supply.

### 2. Customer (Service Seeker)
A real person with a real need ("I need a plumber", "I need someone to fix something"). Represents demand.

### 3. Observer (You)
You do NOT intervene unless the system breaks completely. Your job is to watch friction, record confusion, record drop-off points, and stay silent unless necessary. You are not "helping the app." You are watching human behaviour.

---

## ENVIRONMENT SETUP (BEFORE TEST)

### Step A — Steward Preparation (15–30 min)
Sit with the steward physically. Do NOT over-explain the system. You only guide setup:

**Required:**
1. Open iPhande app.
2. Complete profile: Name, Trade (Archetype), Location, Phone number.
3. Upload: 1–3 real photos of past work (even from WhatsApp).
4. Ensure: Profile is marked **Public** and "Verified" badge is visible.

**Important instruction to steward. Say exactly this:**
> *"People will now try to find you. Don’t send them your link. Let’s see if they can find you themselves."*

### Step B — Customer Preparation (5 min)
Do NOT show the app. Do NOT explain features. You only say:
> *"Try to find someone who can help you with [service]."*
*(e.g., plumber → leaking tap, electrician → socket not working)*
Then give them the phone.

---

## EXECUTION SCRIPT

### PHASE 1 — DISCOVERY TEST
**Instruction to customer:**
> *"You are looking for someone to help you. Use this app however you think makes sense."*

Observe silently. Record:
- Do they find `/public` naturally?
- Do they understand search?
- Do they scroll or hesitate?
- Do they abandon?

*DO NOT HELP unless stuck for >2 minutes. If stuck, only say: "Try looking for the type of service you need."*

### PHASE 2 — SELECTION TEST
When results appear, observe:
- Do they understand the "Verified" badge?
- Do they click randomly or intentionally?
- Do they open multiple profiles?
- Record Confusion level (Low / Medium / High).

### PHASE 3 — TRUST TEST (CRITICAL MOMENT)
Inside profile, observe:
- Do they scroll Proof of Work?
- Do they trust what they see?
- Do they hesitate before contact?
*Key question (DO NOT ASK THEM YET): Does trust form visually, or is it missing?*

### PHASE 4 — CONTACT TEST
They must now take action (WhatsApp button OR Request Service form). Observe:
- Do they click?
- Do they hesitate?
- Do they abandon?
*Record exact behaviour. This is the conversion moment.*

### PHASE 5 — STEWARD RESPONSE
Now switch attention to steward. Observe:
- Do they receive the lead?
- Do they understand it?
- Do they respond quickly?
*Ask steward ONLY after: "What did you receive?" Do NOT guide response.*

### PHASE 6 — CLOSURE CHECK
After first interaction, ask BOTH parties:
- **Customer:** *"Did this feel easier than finding someone normally?"*
- **Steward:** *"Did this feel like a real customer?"*
*Do NOT correct answers. Just record truth.*

---

## FAILURE POINT CLASSIFICATION
If loop fails, classify:
- **A. Discovery Failure:** Customer cannot find a steward.
- **B. Trust Failure:** Customer sees profile but does not contact.
- **C. Conversion Failure:** Customer contacts but no lead is generated.
- **D. Steward Failure:** Steward does not respond or understand system.

---

## SUCCESS CRITERION
You succeed if ANY of the following happens:
- **Minimum Success:** Customer sends WhatsApp message.
- **Strong Success:** Steward responds.
- **Full Success:** Job discussion begins.

---

## OBSERVER NOTES TEMPLATE

```text
Customer Type:
Service Requested:

Time to Find Steward:
Confusion Points:

Profiles Viewed:
Trust Signals Noticed:

Action Taken:
(WhatsApp / Request Form / None)

Breakdown Point:
(Discovery / Trust / Conversion / Steward)

Outcome:
```

---

## CRITICAL RULES
- **Rule 1:** Do NOT explain the system.
- **Rule 2:** Do NOT fix UX during test.
- **Rule 3:** Do NOT defend the product.
- **Rule 4:** Only observe human behaviour.

**WHAT YOU ARE REALLY TESTING:**
> *"Can trust be transferred digitally between two strangers in under 2 minutes?"*
