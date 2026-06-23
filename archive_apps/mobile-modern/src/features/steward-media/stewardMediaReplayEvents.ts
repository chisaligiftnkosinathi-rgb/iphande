// stewardMediaReplayEvents.ts
// Constitutional replay event vocabulary for steward media continuity in iPhande

export type StewardMediaReplayEventType =
    | 'steward_media_draft_created'
    | 'steward_media_draft_updated'
    | 'generation_requested'
    | 'generation_completed'
    | 'manual_caption_edited'
    | 'platform_changed';

export interface StewardMediaReplayEvent {
    type: StewardMediaReplayEventType;
    timestamp: string; // ISO8601
    actor: 'steward' | 'system' | 'ai';
    payload?: Record<string, any>;
}

// Example: event factory
export function createStewardMediaReplayEvent(
    type: StewardMediaReplayEventType,
    actor: 'steward' | 'system' | 'ai',
    payload?: Record<string, any>
): StewardMediaReplayEvent {
    return {
        type,
        timestamp: new Date().toISOString(),
        actor,
        payload,
    };
}
