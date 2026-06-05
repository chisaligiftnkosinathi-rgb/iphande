// Media upload and continuity capture service for mobile
import { Platform } from 'react-native';
import { buildApiUrl } from '../src/config/api';

export async function uploadMedia(uri: string, filename: string, mimeType: string): Promise<{ media_id: string, media_url: string }> {
    const formData = new FormData();
    formData.append('file', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        name: filename,
        type: mimeType,
    } as any);
    const res = await fetch(buildApiUrl('/media/upload'), {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    if (!res.ok) throw new Error('Upload failed');
    return await res.json();
}

export async function createContinuityCapture({ steward_id, source_type, raw_media_id, context_hint }: { steward_id: string, source_type: string, raw_media_id: string, context_hint?: string }) {
    const res = await fetch(buildApiUrl('/continuity-captures'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steward_id, source_type, raw_media_id, context_hint }),
    });
    if (!res.ok) throw new Error('Continuity capture failed');
    return await res.json();
}

export async function fetchContinuityCaptures(steward_id: string) {
    const res = await fetch(buildApiUrl(`/continuity-captures?steward_id=${encodeURIComponent(steward_id)}`));
    if (!res.ok) throw new Error('Fetch failed');
    return await res.json();
}
