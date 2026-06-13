import uuid
from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from sqlalchemy.orm import Session

from src.database import get_db, replay_transaction
from src.models.financial_event import (
    AccountingCategory,
    CashDirection,
    FinancialEvent,
    FinancialEventType,
)
from src.models.invoice import Invoice, InvoiceStatus
from src.models.payment_intent import PaymentIntent, PaymentIntentStatus
from src.models.payment_intent import ProofOfPayment, ProofOfPaymentStatus
from src.models.quote import Quote
from src.schemas.quote_to_cash_schema import (
    PaymentIntentCreate,
    PaymentIntentOut,
    PaymentIntentReviewOut,
    ProofOfPaymentCreate,
    ProofOfPaymentOut,
)
from src.services.continuity_event_service import emit_continuity_event
from src.services.transition_audit_service import audit_transition


router = APIRouter(prefix="/api/v1/payments", tags=["payments"])


def latest_payment_event(db: Session, payment_id: UUID):
    from src.models.continuity_event_model import ContinuityEvent

    return (
        db.query(ContinuityEvent)
        .filter(
            ContinuityEvent.related_entity_type == "payment_intent",
            ContinuityEvent.related_entity_id == str(payment_id),
        )
        .order_by(ContinuityEvent.lineage_sequence.desc())
        .first()
    )


def evaluate_evidence(payment: PaymentIntent, proof: ProofOfPayment) -> tuple[ProofOfPaymentStatus, list[str]]:
    failures = []
    if proof.extracted_amount is None or proof.extracted_amount != payment.amount:
        failures.append("amount_mismatch_or_missing")
    if not proof.extracted_reference:
        failures.append("reference_missing")
    if not proof.payer_name:
        failures.append("payer_name_missing")
    if proof.account_info_present != "true":
        failures.append("account_info_missing")
    return (
        ProofOfPaymentStatus.evidence_check_failed
        if failures
        else ProofOfPaymentStatus.evidence_check_passed,
        failures,
    )


@router.get("/intents/business/{business_owner_id}", response_model=list[PaymentIntentReviewOut])
def list_payment_intents_for_business(business_owner_id: str, db: Session = Depends(get_db)):
    payments = (
        db.query(PaymentIntent)
        .filter(PaymentIntent.business_owner_id == business_owner_id)
        .order_by(PaymentIntent.created_at.desc())
        .all()
    )

    results = []
    for payment in payments:
        quote = db.query(Quote).filter(Quote.id == payment.quote_id).first()
        latest_proof = (
            db.query(ProofOfPayment)
            .filter(ProofOfPayment.payment_intent_id == payment.id)
            .order_by(ProofOfPayment.created_at.desc())
            .first()
        )
        results.append(
            PaymentIntentReviewOut(
                payment_intent_id=payment.id,
                quote_id=payment.quote_id,
                quote_request_id=quote.customer_request_id if quote else None,
                business_owner_id=payment.business_owner_id,
                customer_name=quote.customer_name if quote else None,
                amount=payment.amount,
                currency=payment.currency,
                status=payment.status,
                payment_reference=payment.payment_reference,
                receipt_number=payment.receipt_number,
                latest_proof_file_name=latest_proof.file_name if latest_proof else None,
                evidence_status=latest_proof.evidence_status if latest_proof else None,
                evidence_notes=latest_proof.notes if latest_proof else None,
                extracted_reference=latest_proof.extracted_reference if latest_proof else None,
                created_at=payment.created_at,
                updated_at=payment.confirmed_at,
            )
        )
    return results


@router.post("/intents", response_model=PaymentIntentOut)
def create_payment_intent(payload: PaymentIntentCreate, db: Session = Depends(get_db)):
    parent_event_id = None
    business_owner_id = None
    amount = None
    currency = None
    quote_id = None
    invoice_id = None

    if getattr(payload, "invoice_id", None):
        invoice = db.query(Invoice).filter(Invoice.id == payload.invoice_id).first()
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        if invoice.status != InvoiceStatus.issued:
            raise HTTPException(status_code=409, detail="Payment intents require an issued invoice")
        parent_event_id = invoice.continuity_event_id
        business_owner_id = invoice.business_owner_id
        amount = invoice.amount
        currency = invoice.currency
        quote_id = invoice.quote_id
        invoice_id = invoice.id
    elif getattr(payload, "quote_id", None):
        quote = db.query(Quote).filter(Quote.id == payload.quote_id).first()
        if not quote:
            raise HTTPException(status_code=404, detail="Quote not found")
        parent_event_id = quote.continuity_event_id
        business_owner_id = quote.business_owner_id
        amount = quote.amount
        currency = quote.currency
        quote_id = quote.id
    else:
        raise HTTPException(status_code=400, detail="Must provide either invoice_id or quote_id")

    payment_id = uuid.uuid4()
    payment = PaymentIntent(
        id=payment_id,
        business_owner_id=business_owner_id,
        invoice_id=invoice_id,
        quote_id=quote_id,
        provider_name=payload.provider_name,
        payment_reference=f"demo-{uuid.uuid4()}",
        payer_reference=payload.payer_reference,
        amount=amount,
        currency=currency,
        status=PaymentIntentStatus.pending,
    )

    try:
        audit_transition(
            db,
            business_owner_id=business_owner_id,
            entity_type="PaymentIntent",
            entity_id=str(payment.id),
            current_state="created",
            next_state="pending",
            actor_type="system",
            actor_id=payload.provider_name,
        )
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))

    with replay_transaction(db):
        event = emit_continuity_event(
            db,
            business_owner_id=payment.business_owner_id,
            business_category_key=None,
            business_line=None,
            event_type="payment_intent_created",
            actor_type="system",
            actor_id=payment.provider_name,
            related_entity_type="payment_intent",
            related_entity_id=str(payment.id),
            parent_event_id=parent_event_id,
            payload={
                "invoice_id": str(invoice_id) if invoice_id else None,
                "quote_id": str(quote_id) if quote_id else None,
                "provider_name": payment.provider_name,
                "payment_reference": payment.payment_reference,
                "amount": str(payment.amount),
                "currency": payment.currency,
                "demo_only": True,
            },
            auto_commit=False,
        )
        payment.continuity_event_id = event.id
        db.add(payment)
        db.flush()
        db.refresh(payment)
    return payment


@router.post("/intents/{payment_id}/receipt-upload", response_model=PaymentIntentOut)
def upload_payment_receipt(
    payment_id: UUID,
    receipt_file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    payment = db.query(PaymentIntent).filter(PaymentIntent.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment intent not found")

    # Create proof record but do not automatically evaluate or verify
    proof_id = uuid.uuid4()
    proof = ProofOfPayment(
        id=proof_id,
        payment_intent_id=payment.id,
        file_name=receipt_file.filename,
        file_type=receipt_file.content_type,
        uploaded_by="business_owner",
    )

    # Only progress state to submitted; Steward verification is still required
    if payment.status in {PaymentIntentStatus.pending, PaymentIntentStatus.evidence_awaiting}:
        payment.status = PaymentIntentStatus.evidence_submitted

    latest_event = latest_payment_event(db, payment.id)

    with replay_transaction(db):
        event = emit_continuity_event(
            db,
            business_owner_id=payment.business_owner_id,
            business_category_key=None,
            business_line=None,
            event_type="receipt_uploaded",
            actor_type="business_owner",
            actor_id=payment.business_owner_id,
            related_entity_type="proof_of_payment",
            related_entity_id=str(proof.id),
            parent_event_id=latest_event.id if latest_event else payment.continuity_event_id,
            payload={
                "payment_intent_id": str(payment.id),
                "proof_id": str(proof.id),
                "file_name": receipt_file.filename,
                "file_type": receipt_file.content_type,
                "message": "Receipt metadata attached. File storage not yet implemented.",
                "truth_boundary": "Receipt metadata attached. File storage not yet implemented. Not steward verified.",
            },
            auto_commit=False,
        )
        proof.continuity_event_id = event.id
        db.add(proof)
        db.flush()
        db.refresh(payment)
    return payment

@router.post("/intents/{payment_id}/proofs", response_model=ProofOfPaymentOut)
def submit_proof_of_payment(
    payment_id: UUID,
    payload: ProofOfPaymentCreate,
    db: Session = Depends(get_db),
):
    payment = db.query(PaymentIntent).filter(PaymentIntent.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment intent not found")
    if payment.status not in {
        PaymentIntentStatus.evidence_awaiting,
        PaymentIntentStatus.evidence_submitted,
        PaymentIntentStatus.under_review,
        PaymentIntentStatus.pending,
    }:
        raise HTTPException(status_code=409, detail="Payment intent is not accepting evidence")

    proof_id = uuid.uuid4()
    proof = ProofOfPayment(
        id=proof_id,
        payment_intent_id=payment.id,
        file_name=payload.file_name,
        file_type=payload.file_type,
        uploaded_by=payload.uploaded_by,
        extracted_amount=payload.extracted_amount,
        extracted_reference=payload.extracted_reference,
        payer_name=payload.payer_name,
        account_info_present="true" if payload.account_info_present else "false",
        notes=payload.notes,
    )
    evidence_status, failures = evaluate_evidence(payment, proof)
    proof.evidence_status = evidence_status

    with replay_transaction(db):
        submitted_event = emit_continuity_event(
            db,
            business_owner_id=payment.business_owner_id,
            business_category_key=None,
            business_line=None,
            event_type="payment_evidence_submitted",
            actor_type=payload.uploaded_by,
            actor_id=payload.payer_name or payload.uploaded_by,
            related_entity_type="proof_of_payment",
            related_entity_id=str(proof.id),
            parent_event_id=latest_payment_event(db, payment.id).id if latest_payment_event(db, payment.id) else payment.continuity_event_id,
            payload={
                "payment_intent_id": str(payment.id),
                "proof_id": str(proof.id),
                "file_name": proof.file_name,
                "file_type": proof.file_type,
                "amount": str(proof.extracted_amount) if proof.extracted_amount is not None else None,
                "currency": payment.currency,
                "reference": proof.extracted_reference,
            },
            auto_commit=False,
        )
        check_event = emit_continuity_event(
            db,
            business_owner_id=payment.business_owner_id,
            business_category_key=None,
            business_line=None,
            event_type=evidence_status.value,
            actor_type="system",
            actor_id="evidence_checker",
            related_entity_type="proof_of_payment",
            related_entity_id=str(proof.id),
            parent_event_id=submitted_event.id,
            payload={
                "payment_intent_id": str(payment.id),
                "proof_id": str(proof.id),
                "evidence_status": evidence_status.value,
                "failures": failures,
                "truth_boundary": "Evidence check is not payment verification.",
            },
            auto_commit=False,
        )
        review_event = emit_continuity_event(
            db,
            business_owner_id=payment.business_owner_id,
            business_category_key=None,
            business_line=None,
            event_type="payment_under_review",
            actor_type="system",
            actor_id="evidence_checker",
            related_entity_type="payment_intent",
            related_entity_id=str(payment.id),
            parent_event_id=check_event.id,
            payload={
                "payment_intent_id": str(payment.id),
                "proof_id": str(proof.id),
                "next_status": PaymentIntentStatus.under_review.value,
            },
            auto_commit=False,
        )
        proof.continuity_event_id = submitted_event.id
        payment.status = PaymentIntentStatus.under_review
        db.add(proof)
        db.flush()
        db.refresh(proof)
    return proof


@router.post("/intents/{payment_id}/verify", response_model=PaymentIntentOut)
def verify_payment_intent(payment_id: UUID, db: Session = Depends(get_db)):
    payment = db.query(PaymentIntent).filter(PaymentIntent.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment intent not found")
    if payment.status != PaymentIntentStatus.under_review:
        raise HTTPException(status_code=409, detail="Only payments under review can be verified")

    with replay_transaction(db):
        payment.status = PaymentIntentStatus.verified
        payment.confirmed_at = datetime.now(timezone.utc)
        event = emit_continuity_event(
            db,
            business_owner_id=payment.business_owner_id,
            business_category_key=None,
            business_line=None,
            event_type="payment_verified",
            actor_type="business_owner",
            actor_id=payment.business_owner_id,
            related_entity_type="payment_intent",
            related_entity_id=str(payment.id),
            parent_event_id=latest_payment_event(db, payment.id).id,
            payload={
                "payment_intent_id": str(payment.id),
                "quote_id": str(payment.quote_id),
                "amount": str(payment.amount),
                "currency": payment.currency,
                "previous_status": PaymentIntentStatus.under_review.value,
                "next_status": PaymentIntentStatus.verified.value,
            },
            auto_commit=False,
        )
        payment.confirmed_continuity_event_id = event.id
        db.flush()
        db.refresh(payment)
    return payment


@router.post("/intents/{payment_id}/reject", response_model=PaymentIntentOut)
def reject_payment_intent(payment_id: UUID, db: Session = Depends(get_db)):
    payment = db.query(PaymentIntent).filter(PaymentIntent.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment intent not found")
    if payment.status != PaymentIntentStatus.under_review:
        raise HTTPException(status_code=409, detail="Only payments under review can be rejected")

    with replay_transaction(db):
        payment.status = PaymentIntentStatus.rejected
        event = emit_continuity_event(
            db,
            business_owner_id=payment.business_owner_id,
            business_category_key=None,
            business_line=None,
            event_type="payment_rejected",
            actor_type="business_owner",
            actor_id=payment.business_owner_id,
            related_entity_type="payment_intent",
            related_entity_id=str(payment.id),
            parent_event_id=latest_payment_event(db, payment.id).id,
            payload={
                "payment_intent_id": str(payment.id),
                "quote_id": str(payment.quote_id),
                "previous_status": PaymentIntentStatus.under_review.value,
                "next_status": PaymentIntentStatus.rejected.value,
            },
            auto_commit=False,
        )
        payment.confirmed_continuity_event_id = event.id
        db.flush()
        db.refresh(payment)
    return payment


@router.post("/intents/{payment_id}/receipt", response_model=PaymentIntentOut)
def issue_receipt(payment_id: UUID, db: Session = Depends(get_db)):
    payment = db.query(PaymentIntent).filter(PaymentIntent.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment intent not found")
    if payment.status != PaymentIntentStatus.verified:
        raise HTTPException(status_code=409, detail="Receipt requires verified payment")
    if payment.receipt_number:
        return payment

    receipt_number = f"RCPT-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{str(payment.id)[:8]}"
    with replay_transaction(db):
        event = emit_continuity_event(
            db,
            business_owner_id=payment.business_owner_id,
            business_category_key=None,
            business_line=None,
            event_type="receipt_issued",
            actor_type="business_owner",
            actor_id=payment.business_owner_id,
            related_entity_type="payment_intent",
            related_entity_id=str(payment.id),
            parent_event_id=latest_payment_event(db, payment.id).id,
            payload={
                "payment_intent_id": str(payment.id),
                "quote_id": str(payment.quote_id),
                "receipt_number": receipt_number,
                "amount": str(payment.amount),
                "currency": payment.currency,
            },
            auto_commit=False,
        )
        payment.receipt_number = receipt_number
        payment.receipt_continuity_event_id = event.id
        db.flush()
        db.refresh(payment)
    return payment


@router.post("/{payment_id}/confirm-demo", response_model=PaymentIntentOut)
def confirm_demo_payment(payment_id: UUID, db: Session = Depends(get_db)):
    raise HTTPException(status_code=501, detail="Demo payments are disabled in production.")
