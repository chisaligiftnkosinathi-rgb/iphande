import type { ContinuityEvent } from '../types/replay';

const titleCaseEventType = (eventType: string): string =>
    eventType
        .split('_')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');

export const formatContinuityEventLabel = (
    event: Pick<ContinuityEvent, 'event_type' | 'payload_json'>
): string => {
    if (event.event_type === 'profile_created') {
        const profileName = event.payload_json?.profile_name;
        return typeof profileName === 'string' && profileName.trim()
            ? `Profile created for ${profileName.trim()}`
            : 'Profile created';
    }

    return titleCaseEventType(event.event_type);
};
