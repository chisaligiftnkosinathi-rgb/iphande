/**
 * Layer 2 - Calling Registry
 * A calling is the deeper identity behind the work.
 */
export interface CallingDefinition {
    key: string;
    label: string;
    description: string;
}

export const CALLING_REGISTRY: Record<string, CallingDefinition> = {
    builder: { key: 'builder', label: 'Builder', description: 'Brings new things into existence.' },
    protector: { key: 'protector', label: 'Protector', description: 'Safeguards people, assets, and truth.' },
    teacher: { key: 'teacher', label: 'Teacher', description: 'Transfers knowledge and wisdom.' },
    organizer: { key: 'organizer', label: 'Organizer', description: 'Brings order to chaos.' },
    creator: { key: 'creator', label: 'Creator', description: 'Expresses beauty and function.' },
    healer: { key: 'healer', label: 'Healer', description: 'Restores what is broken or hurting.' },
    connector: { key: 'connector', label: 'Connector', description: 'Bridges gaps between people and needs.' },
    caretaker: { key: 'caretaker', label: 'Caretaker', description: 'Nurtures and maintains life.' },
    explorer: { key: 'explorer', label: 'Explorer', description: 'Discovers new paths and knowledge.' },
    messenger: { key: 'messenger', label: 'Messenger', description: 'Delivers information and truth.' },
};
