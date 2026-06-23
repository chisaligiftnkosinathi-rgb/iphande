import { StewardSignals } from './stewardStateRegistry';

/**
 * Layer 24 — Lifestyle Pattern Registry
 * A derived layer that identifies recurring stewardship behaviors.
 */

export type LifestyleCategory = keyof StewardSignals;

export interface StewardLifestylePattern {
    id: string;
    stewardId: string;
    category: LifestyleCategory;
    pattern: string;
    /** How many times this pattern was detected across reviews */
    frequency: number;
    /** The cumulative shift in the relevant signal score */
    observedImpact: number;
    /** 0.0 to 1.0 based on frequency and variance */
    confidence: number;
    firstObserved: Date;
    lastObserved: Date;
}
