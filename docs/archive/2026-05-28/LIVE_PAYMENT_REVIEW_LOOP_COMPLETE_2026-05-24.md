# Live Payment Review Loop Complete

**Date:** 2026-05-24

iPhande has completed its first live payment review loop with a preserved truth boundary between submitted evidence and verified payment.

## Verified Operational Chain

The live workflow now supports:

```text
quote request
quote drafted
quote sent
payment intent created
payment evidence submitted
evidence checked
steward review
payment verification or rejection
receipt issuance
replay proof
```

## Backend Endpoints

The payment review loop is supported by:

```text
POST /api/v1/quotes/{quote_id}/send
POST /api/v1/quotes/{quote_id}/payment-intents
POST /api/v1/payments/intents/{payment_intent_id}/proofs
POST /api/v1/payments/intents/{payment_intent_id}/verify
POST /api/v1/payments/intents/{payment_intent_id}/reject
POST /api/v1/payments/intents/{payment_intent_id}/receipt
GET  /api/v1/payments/intents/business/{business_owner_id}
```

## Mobile Surface

The mobile app now includes:

```text
More -> Payment Review
```

The screen shows:

```text
customer
quote id
quote request id
amount and currency
payment reference
proof file name
evidence status
evidence notes
payment status
receipt number
replay link
```

Available steward actions:

```text
Verify
Reject
Issue Receipt
Open Replay
```

Receipt issuance is disabled unless payment status is `verified`.

## Wording Boundary

iPhande must not say:

```text
Payment successful
```

just because a screenshot or PDF was uploaded.

Correct wording:

```text
Proof submitted
Evidence check passed
Awaiting steward review
Payment verified
Receipt issued
```

## Truth Boundary

The governing rule is:

```text
Evidence supports verification.
Evidence does not verify itself.
```

An uploaded proof can produce:

```text
evidence_check_passed
evidence_check_failed
payment_under_review
```

Only steward verification can produce:

```text
payment_verified
```

Only verified payment can produce:

```text
receipt_issued
```

## Receipt Guard

The live Railway API correctly rejected early receipt issuance before verification:

```text
Receipt requires verified payment
```

This confirms that receipt generation is guarded by verified payment state, not proof upload state.

## Verified Railway Flow

Fresh live BO004 payment review data was created and returned through:

```text
GET /api/v1/payments/intents/business/BO004
```

Verified live review row:

```text
customer_name: Mpho
amount: ZAR 390.00
status: under_review
latest_proof_file_name: mpho-proof.pdf
evidence_status: evidence_check_passed
receipt_number: null
```

This proves the mobile Payment Review screen has live steward-review data available.

## Replay Chain

The verified replay sequence for the payment evidence flow is:

```text
payment_intent_created
payment_evidence_submitted
evidence_check_passed
payment_under_review
payment_verified
receipt_issued
```

When evidence is incomplete or inconsistent, replay preserves:

```text
payment_evidence_submitted
evidence_check_failed
payment_under_review
```

without marking payment verified.

## Stewardship Meaning

iPhande now preserves a truthful commercial workflow:

```text
request
quote
payment intent
payment evidence
steward verification
receipt
replay proof
```

This protects small-business financial communication from false certainty while still giving stewards a practical operational workflow.

## Next Frontier

The next continuity domain should be:

```text
Support / Giving continuity
```

That layer should emerge only after completed value or meaningful stewardship context, not through pressure or manipulation.
