/**
 * The Need Registry represents the 'Seeds of Trade'.
 * It maps common community needs to the Roles (Archetypes) that solve them.
 */
export interface NeedDefinition {
    key: string;
    label: string;
    suggestedRoleKey: string;
    description: string;
}

export const NEED_REGISTRY: Record<string, NeedDefinition> = {
    food_needed: {
        key: 'food_needed',
        label: 'Food Needed',
        suggestedRoleKey: 'maker',
        description: 'Nourishment for the household or community.'
    },
    transport_needed: {
        key: 'transport_needed',
        label: 'Transport Needed',
        suggestedRoleKey: 'carrier',
        description: 'Movement of people or goods.'
    },
    repair_needed: {
        key: 'repair_needed',
        label: 'Repair Needed',
        suggestedRoleKey: 'fixer',
        description: 'Restoration of broken tools or infrastructure.'
    },
    knowledge_needed: {
        key: 'knowledge_needed',
        label: 'Knowledge Needed',
        suggestedRoleKey: 'teacher_guide',
        description: 'Transfer of skills or information.'
    },
    administration_needed: {
        key: 'administration_needed',
        label: 'Administration Needed',
        suggestedRoleKey: 'organizer',
        description: 'Coordination of systems, money, or people.'
    },
    software_needed: {
        key: 'software_needed',
        label: 'Software Needed',
        suggestedRoleKey: 'system_creator',
        description: 'Digital tools for trade and memory.'
    },
    testing_needed: {
        key: 'testing_needed',
        label: 'Testing / Verification Needed',
        suggestedRoleKey: 'system_creator', // Could also be 'inspector' archetype
        description: 'Ensuring quality and truth in systems.'
    }
};
