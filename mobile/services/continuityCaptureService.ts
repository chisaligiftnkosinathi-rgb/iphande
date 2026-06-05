// Service layer for continuity capture API
import type {
    ContinuityCapture,
    ContinuityCaptureCreateRequest
} from '../types/continuity';
import { buildApiUrl } from '../src/config/api';

export async function createCapture(
    payload: ContinuityCaptureCreateRequest
): Promise<ContinuityCapture> {
    // TODO: Wire to auth/steward context
    const res = await fetch(buildApiUrl('/continuity-captures'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to create continuity capture');
    return await res.json();
}

export async function listCaptures(
    steward_id: string
): Promise<ContinuityCapture[]> {
    const res = await fetch(
        buildApiUrl(`/continuity-captures?steward_id=${encodeURIComponent(steward_id)}`)
    );
    if (!res.ok) throw new Error('Failed to fetch continuity captures');
    return await res.json();
}
