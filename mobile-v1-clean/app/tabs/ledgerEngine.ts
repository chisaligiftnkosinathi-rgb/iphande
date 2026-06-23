import { StewardProvisionProfile } from './provisionProfile';
import { StewardCondition, StewardSignals, StewardState } from './stewardStateRegistry';

/**
 * The raw transactional record for a trade event.
 */
export interface DailyTradeRecord {
    id: string;
    stewardId: string;
    timestamp: Date;
    needKey: string;
    hoursLogged: number;
    distanceKm: number;
    costsIncurred: number;
    evidenceAttached: boolean;
}

/**
 * The payload collected from a conversational Council Session.
 */
export interface CouncilSessionSubmission {
    stewardId: string;
    dispatchId: string;
    timestamp: Date;
    answers: {
        nodeKey: string;
        rawText: string;
        parsedMetrics?: {
            numericValue?: number;
            booleanValue?: boolean;
        };
    }[];
}

export class LedgerEngine {
    /**
     * Processes a conversational session into structural records and updated signals.
     */
    public static processSession(
        submission: CouncilSessionSubmission,
        currentSignals: StewardSignals,
        needKey: string
    ): { tradeRecord: DailyTradeRecord; updatedSignals: StewardSignals } {
        let hours = 0;
        let costs = 0;
        let hasEvidence = false;
        let householdSustained = true;

        for (const answer of submission.answers) {
            const text = answer.rawText.toLowerCase();
            switch (answer.nodeKey) {
                case 'trade':
                    hours = answer.parsedMetrics?.numericValue || 0;
                    break;
                case 'finance':
                    costs = answer.parsedMetrics?.numericValue || 0;
                    break;
                case 'memory':
                    hasEvidence = text.includes("yes") || text.includes("attached") || (answer.parsedMetrics?.booleanValue ?? false);
                    break;
                case 'provision':
                    if (text.includes("no") || text.includes("struggling")) householdSustained = false;
                    break;
            }
        }

        const tradeRecord: DailyTradeRecord = {
            id: `rec_${Math.random().toString(36).substring(2, 11)}`,
            stewardId: submission.stewardId,
            timestamp: submission.timestamp,
            needKey,
            hoursLogged: hours,
            distanceKm: 0, // Resolved in detailed trade logic
            costsIncurred: costs,
            evidenceAttached: hasEvidence
        };

        const updatedSignals: StewardSignals = { ...currentSignals };

        // Weighted Signal Hierarchy: Provision > Trade > Trust > Memory > Finance
        updatedSignals.tradeScore = Math.min(1.0, hours > 0 ? (hours / 8) : currentSignals.tradeScore * 0.95);
        updatedSignals.memoryScore = hasEvidence ? Math.min(1.0, currentSignals.memoryScore + 0.15) : Math.max(0.0, currentSignals.memoryScore - 0.05);
        updatedSignals.trustScore = hasEvidence && hours > 0 ? Math.min(1.0, currentSignals.trustScore + 0.1) : currentSignals.trustScore;
        updatedSignals.provisionScore = householdSustained ? Math.min(1.0, currentSignals.provisionScore + 0.02) : Math.max(0.0, currentSignals.provisionScore - 0.35);

        return { tradeRecord, updatedSignals };
    }

    /**
     * Evaluates signals to form a witness statement (Condition)
     */
    public static deriveCondition(signals: StewardSignals, runwayDays: number): StewardCondition {
        const reasons: string[] = [];
        let state: StewardState = "stable";

        if (signals.provisionScore < 0.4) {
            state = "crisis";
            reasons.push("Household essential provision levels indicate severe distress.");
        } else if (runwayDays < 5) {
            state = "surviving";
            reasons.push(`Financial runway is critically restricted to ${runwayDays} days.`);
        } else if (signals.trustScore > 0.8 && runwayDays > 30) {
            state = "thriving";
            reasons.push("Strong trust equity and healthy operational reserves.");
        }

        return { state, reasons, signals };
    }
}

export interface TradeEconomicResult {
    grossIncome: number;
    directCosts: number;
    netTradeValue: number;      // Price - Direct Costs
    toolReserve: number;        // Future capacity
    emergencyReserve: number;   // Protection
    availableProvision: number; // NetTradeValue - Reserves
    householdNeedImpact: number; // portion of monthly need covered
    surplus: number;            // AvailableProvision - Need
    givingCapacity: number;     // Surplus * Goal
}

/**
 * THE KINGDOM LEDGER ENGINE
 *
 * Calculates the deterministic distribution of value from a single trade
 * based on the steward's provision needs.
 * (Layer 8 of SOS)
 *
 * Price - Direct Costs = Net Trade Value
 * Net Trade Value - Reserves = Available Provision
 * Available Provision - Household Need = Surplus
 */
export const calculateTradeEconomics = (
    totalPrice: number,
    sumOfDirectCosts: number,
    profile: StewardProvisionProfile
): TradeEconomicResult => {

    // 1. Price - Direct Costs = Net Trade Value
    const netTradeValue = totalPrice - sumOfDirectCosts;

    // 2. Calculate Reserves based on Gross Income
    const toolReserve = totalPrice * profile.toolReserveRate;
    const emergencyReserve = totalPrice * profile.emergencyReserveRate;

    // 3. Net Trade Value - Reserves = Available Provision
    const availableProvision = netTradeValue - toolReserve - emergencyReserve;

    // 4. Available Provision - Household Need = Surplus
    // Note: In a real system, household need might be a daily/monthly target.
    // Here we treat the profile.monthlyProvisionTarget as the benchmark.
    const surplus = Math.max(0, availableProvision - (profile.monthlyProvisionTarget / 20)); // Assumes 20 work units/month

    // 5. Giving Capacity is derived exclusively from Surplus
    const givingCapacity = surplus * profile.givingGoalRate;

    return {
        grossIncome: totalPrice,
        directCosts: sumOfDirectCosts,
        netTradeValue,
        toolReserve,
        emergencyReserve,
        availableProvision,
        householdNeedImpact: availableProvision - surplus,
        surplus,
        givingCapacity
    };
};
