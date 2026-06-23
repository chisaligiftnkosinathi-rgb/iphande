/**
 * The human-centric economic profile of a Steward.
 * These values are used by the Ledger Engine to calculate surplus.
 */
export interface StewardProvisionProfile {
    stewardId: string;
    /** Number of dependents relying on this stewardship */
    householdSize: number;
    /** Minimum monthly income required for basic needs */
    monthlyProvisionTarget: number;
    /** % of every trade reserved for tool/asset replacement */
    toolReserveRate: number;
    /** % of surplus the steward aims to give away */
    givingGoalRate: number;
    /** % of every trade reserved for unexpected needs */
    emergencyReserveRate: number;
    /** Average hourly rate for the steward's primary capability */
    baseCapabilityRate: number;
}
