import { CouncilAdjustmentEvent } from './councilEvents';

type EventMap = {
    "COUNCIL_ADJUSTMENT_APPLIED": CouncilAdjustmentEvent;
    // Add other event types here
};

export class LedgerEventBus {
    private static listeners: { [key: string]: Function[] } = {};

    public static emit<K extends keyof EventMap>(eventName: K, event: EventMap[K]): void {
        this.listeners[eventName]?.forEach(listener => listener(event));
    }
    // For simplicity, a subscribe method is omitted but would be present in a full implementation.
}
