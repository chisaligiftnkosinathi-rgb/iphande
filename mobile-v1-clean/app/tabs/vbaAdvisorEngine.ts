import { calculateTradeEconomics, TradeEconomicResult } from './ledgerEngine';
import { StewardProvisionProfile } from './provisionProfile';
import { RATE_REGISTRY } from './rateRegistry';
import { STEWARD_LEDGER_RULES } from './stewardLedgerRules';

export interface WorkInput {
    roleKey: string;
    measurements: Record<string, number>; // e.g., { labour_hours: 3, distance_km: 15 }
    directCostsMonetary: number; // Sum of materials/tolls/etc.
}

export interface VBAAdvice {
    suggestedPrice: number;
    labourValue: number;
    travelValue: number;
    economics: TradeEconomicResult;
}

/**
 * The First Living Loop:
 * Transforms Work + Measurements + Costs -> Suggested Price -> Provision.
 */
export const getStewardAdvice = (
    input: WorkInput,
    profile: StewardProvisionProfile
): VBAAdvice => {
    const rules = STEWARD_LEDGER_RULES[input.roleKey];

    // 1. Calculate Value of Work (Labour)
    // We use the rate registry for the default measurement of the role
    const labourRate = RATE_REGISTRY['labour_standard']?.baseRate || profile.baseCapabilityRate;
    const labourHours = input.measurements['labour_hours'] || 0;
    const labourValue = labourHours * labourRate;

    // 2. Calculate Value of Travel
    const travelRate = RATE_REGISTRY['travel_standard']?.baseRate || 0;
    const travelKm = input.measurements['distance_km'] || 0;
    const travelValue = travelKm * travelRate;

    // 3. Calculate Suggested Price
    // Price = (Work Value + Travel Value + Direct Costs)
    // This is a 'Dignity Price' - it ensures costs and time are covered.
    const suggestedPrice = labourValue + travelValue + input.directCostsMonetary;

    // 4. Run through Ledger Engine to see the Provision impact
    const economics = calculateTradeEconomics(
        suggestedPrice,
        input.directCostsMonetary,
        profile
    );

    return {
        suggestedPrice,
        labourValue,
        travelValue,
        economics
    };
};
