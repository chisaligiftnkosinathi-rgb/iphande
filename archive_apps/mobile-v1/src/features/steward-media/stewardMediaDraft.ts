// stewardMediaDraft.ts
// Truthful draft input shape for steward-driven media generation in iPhande

export interface StewardMediaDraft {
    business_owner_id: string;
    business_archetype_key: string;
    business_line: string;
    platform?: string;
    goal_key?: string;
    offer_details?: string;
    location?: string;
    contact_method?: string;
    tone?: string;
}

// Example: create a new draft (to be managed by context or state in the future)
export function createEmptyStewardMediaDraft(): StewardMediaDraft {
    return {
        business_owner_id: '',
        business_archetype_key: '',
        business_line: '',
        platform: undefined,
        goal_key: undefined,
        offer_details: undefined,
        location: undefined,
        contact_method: undefined,
        tone: undefined,
    };
}
