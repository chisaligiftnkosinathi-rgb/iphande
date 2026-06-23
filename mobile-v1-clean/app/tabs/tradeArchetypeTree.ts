export type PlatformScope = 'iphande' | 'axionyx' | 'both';
import { StewardCondition } from './stewardStateRegistry';
export type ProofType = 'before_after' | 'receipt' | 'attendance' | 'document' | 'general';
export type QuoteTemplate = 'materials_labor' | 'flat_rate' | 'commission' | 'hourly';
// Based on api/src/domain/lineage_registry.py
export type TrustLineageKey = 'commission_based_sales' | 'repair_maintenance' | 'service_business' | 'general';
export type Capability = string;

export interface TradeArchetype {
    key: string;
    label: string;
    description: string;
    examples: string[];
    platform_scope: PlatformScope;
    primaryCallingKey: string;
    capabilities: Capability[];
    features: {
        requiresRadius: boolean;
        proofType: ProofType;
        quoteTemplate: QuoteTemplate;
        commonExpenses: string[];
        trustLineage: TrustLineageKey;
    };
}

export interface ArchetypeGroup {
    key: string;
    label: string;
    description: string;
    archetypes: Record<string, TradeArchetype>;
}

/**
 * The Steward Profile represents the human identity.
 * It tracks the various roles (Archetypes) a steward can play.
 * It also tracks the steward's current state.
 */
export interface StewardProfile {
    stewardName: string;
    /** The primary calling or main business focus */
    primaryRoleKey: string;
    /** Additional roles the steward is capable of performing */
    secondaryRoleKeys: string[];
    /** The role the steward is operating in at this particular moment. Refers to TradeArchetype key. */
    activeRoleKey: string;
    /** Active functional nodes of the Assistant. Refers to StewardshipNode keys. */
    activeStewardshipNodes: string[];
    stewardCondition: StewardCondition;
    customCapabilities?: Capability[];
}

export const TRADE_ARCHETYPE_TREE: Record<string, ArchetypeGroup> = {
    provision: {
        key: 'provision',
        label: 'Provision Archetypes',
        description: 'People who provide basic human needs like food, water, shelter, clothing, and care.',
        archetypes: {
            caregiver: {
                key: 'caregiver',
                label: 'Caregiver',
                description: 'Supports people directly.',
                examples: ['Cleaner', 'Child Minder', 'Elderly Care', 'Community Worker'],
                platform_scope: 'iphande',
                primaryCallingKey: 'caretaker',
                capabilities: ['Direct Support', 'Assistance', 'Care Coordination', 'Monitoring'],
                features: {
                    requiresRadius: true,
                    proofType: 'general',
                    quoteTemplate: 'hourly',
                    commonExpenses: ['Cleaning Supplies', 'Transport'],
                    trustLineage: 'service_business',
                }
            },
        }
    },
    restoration: {
        key: 'restoration',
        label: 'Restoration Archetypes',
        description: 'People who repair, heal, maintain, and clean.',
        archetypes: {
            fixer: {
                key: 'fixer',
                label: 'Fixer',
                description: 'Repairs and restores.',
                examples: ['Plumber', 'Mechanic', 'Electrician'],
                platform_scope: 'iphande',
                primaryCallingKey: 'healer',
                capabilities: ['Diagnosis', 'Repair', 'Installation', 'Maintenance'],
                features: {
                    requiresRadius: true,
                    proofType: 'before_after',
                    quoteTemplate: 'materials_labor',
                    commonExpenses: ['Spare Parts', 'Travel / Call-out', 'Tools'],
                    trustLineage: 'repair_maintenance',
                }
            },
        }
    },
    movement: {
        key: 'movement',
        label: 'Movement Archetypes',
        description: 'People who move goods, people, energy, and data.',
        archetypes: {
            carrier: {
                key: 'carrier',
                label: 'Carrier',
                description: 'Moves people, goods, messages.',
                examples: ['Driver', 'Delivery', 'Logistics'],
                platform_scope: 'iphande',
                primaryCallingKey: 'messenger',
                capabilities: ['Transport', 'Delivery', 'Route Optimization', 'Logistics'],
                features: {
                    requiresRadius: true,
                    proofType: 'receipt',
                    quoteTemplate: 'flat_rate',
                    commonExpenses: ['Fuel', 'Vehicle Maintenance', 'Tolls'],
                    trustLineage: 'service_business',
                }
            },
        }
    },
    creation: {
        key: 'creation',
        label: 'Creation Archetypes',
        description: 'People who make, build, design, and manufacture.',
        archetypes: {
            maker: {
                key: 'maker',
                label: 'Maker',
                description: 'Creates goods or products.',
                examples: ['Baker', 'Welder', 'Carpenter', 'Tailor'],
                platform_scope: 'iphande',
                primaryCallingKey: 'builder',
                capabilities: ['Product Design', 'Fabrication', 'Assembly', 'Quality Control'],
                features: {
                    requiresRadius: false,
                    proofType: 'before_after',
                    quoteTemplate: 'materials_labor',
                    commonExpenses: ['Raw Materials', 'Tools', 'Equipment Maintenance'],
                    trustLineage: 'service_business',
                }
            },
        }
    },
    exchange: {
        key: 'exchange',
        label: 'Exchange Archetypes',
        description: 'People who sell, broker, trade, and negotiate.',
        archetypes: {
            seller: {
                key: 'seller',
                label: 'Seller',
                description: 'Connects goods/services to buyers.',
                examples: ['Commission Agent', 'Street Vendor', 'Sales Rep'],
                platform_scope: 'iphande',
                primaryCallingKey: 'connector',
                capabilities: ['Lead Generation', 'Negotiation', 'Closing Sales', 'Market Research'],
                features: {
                    requiresRadius: false,
                    proofType: 'receipt',
                    quoteTemplate: 'commission',
                    commonExpenses: ['Inventory / Stock', 'Airtime / Data', 'Transport'],
                    trustLineage: 'commission_based_sales',
                }
            },
        }
    },
    knowledge: {
        key: 'knowledge',
        label: 'Knowledge Archetypes',
        description: 'People who teach, analyze, advise, and interpret.',
        archetypes: {
            teacher_guide: {
                key: 'teacher_guide',
                label: 'Teacher / Guide',
                description: 'Transfers knowledge.',
                examples: ['Tutor', 'Trainer', 'Coach', 'Consultant'],
                platform_scope: 'iphande',
                primaryCallingKey: 'teacher',
                capabilities: ['Explanation', 'Training', 'Assessment', 'Mentorship'],
                features: {
                    requiresRadius: false,
                    proofType: 'attendance',
                    quoteTemplate: 'hourly',
                    commonExpenses: ['Stationery', 'Software Subscriptions', 'Data'],
                    trustLineage: 'service_business',
                }
            },
        }
    },
    governance: {
        key: 'governance',
        label: 'Governance Archetypes',
        description: 'People who organize, regulate, administer, and verify.',
        archetypes: {
            organizer: {
                key: 'organizer',
                label: 'Organizer',
                description: 'Coordinates people, events, money, or community systems.',
                examples: ['Church Admin', 'Stokvel Leader', 'Event Planner'],
                platform_scope: 'iphande',
                primaryCallingKey: 'organizer',
                capabilities: ['Coordination', 'Scheduling', 'Resource Management', 'Communication'],
                features: {
                    requiresRadius: false,
                    proofType: 'document',
                    quoteTemplate: 'flat_rate',
                    commonExpenses: ['Venue Hire', 'Catering', 'Communication'],
                    trustLineage: 'service_business',
                }
            },
        }
    },
    industrial: {
        key: 'industrial',
        label: 'Industrial Archetypes',
        description: 'People/systems that operate at infrastructure scale.',
        archetypes: {}
    },
    digital_intelligence: {
        key: 'digital_intelligence',
        label: 'Digital / Intelligence Archetypes',
        description: 'People/systems that build software, automation, AI, and data memory.',
        archetypes: {
            system_creator: {
                key: 'system_creator',
                label: 'System Creator',
                description: 'Builds systems of memory, trust, automation, and trade.',
                examples: ['Platform Builder', 'Software Architect', 'Truth System Steward'],
                platform_scope: 'both',
                primaryCallingKey: 'builder',
                capabilities: ['System Design', 'Software Building', 'Integration', 'Automation'],
                features: {
                    requiresRadius: false,
                    proofType: 'document',
                    quoteTemplate: 'materials_labor',
                    commonExpenses: ['Software Tools', 'Data', 'Cloud Hosting', 'Devices'],
                    trustLineage: 'service_business',
                }
            }
        }
    }
};

export const getArchetypeGroups = () => Object.values(TRADE_ARCHETYPE_TREE);

export const getArchetypesList = (): TradeArchetype[] => {
    return Object.values(TRADE_ARCHETYPE_TREE).flatMap(group => Object.values(group.archetypes));
};

export const getArchetypeByKey = (key: string): TradeArchetype | undefined => {
    for (const group of Object.values(TRADE_ARCHETYPE_TREE)) {
        if (group.archetypes[key]) {
            return group.archetypes[key];
        }
    }
    return undefined;
};

/**
 * Resolves the full archetype object for the steward's currently active role.
 */
export const getActiveArchetype = (profile: StewardProfile): TradeArchetype | undefined => {
    return getArchetypeByKey(profile.activeRoleKey);
};

/**
 * Aggregates all capabilities available to a steward across all their assigned roles.
 * This helps the system discover overlaps and "merged" roles (e.g., Trainer, Mentor).
 */
export const getStewardCapabilities = (profile: StewardProfile): Capability[] => {
    const capabilities = new Set<Capability>([]);

    const activeArchetype = getArchetypeByKey(profile.activeRoleKey);
    if (activeArchetype) activeArchetype.capabilities.forEach(cap => capabilities.add(cap));

    return Array.from(capabilities); // Convert Set to Array
};
