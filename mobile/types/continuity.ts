// Types for continuity capture, aligned with backend schema

export type ContinuityCaptureStatus =
    | 'captured'
    | 'review_later'
    | 'linked'
    | 'archived';

export type ContinuityCaptureSourceType =
    | 'quick_text'
    | 'voice_note'
    | 'screenshot'
    | 'photo'
    | 'whatsapp_context'
    | 'payment_signal'
    | 'promise_fragment'
    | 'other';

export interface ContinuityCapture {
    id: string;
    steward_id: string;
    source_type: ContinuityCaptureSourceType;
    raw_text?: string;
    raw_media_id?: string;
    context_hint?: string;
    status: ContinuityCaptureStatus;
    created_at: string;
    updated_at: string;
}

export interface ContinuityCaptureCreateRequest {
    steward_id: string;
    source_type: ContinuityCaptureSourceType;
    raw_text?: string;
    raw_media_id?: string;
    context_hint?: string;
    status?: ContinuityCaptureStatus;
}
