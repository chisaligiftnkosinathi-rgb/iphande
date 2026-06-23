export type EventType =
    | 'API_CALL'
    | 'API_SUCCESS'
    | 'API_ERROR'
    | 'LATENCY_SAMPLE';

export interface EventItem {
    id: string;
    type: EventType;
    message: string;
    timestamp: number;
    meta?: Record<string, any>;
}

class EventStream {
    private events: EventItem[] = [];
    private listeners: ((events: EventItem[]) => void)[] = [];

    add(event: Omit<EventItem, 'id' | 'timestamp'>) {
        const newEvent: EventItem = {
            id: Math.random().toString(36).substring(2, 9),
            timestamp: Date.now(),
            ...event,
        };

        // Cap the memory window at 30 events to avoid layout leakages
        this.events = [newEvent, ...this.events].slice(0, 30);
        this.emit();
    }

    getAll() {
        return this.events;
    }

    subscribe(listener: (events: EventItem[]) => void) {
        this.listeners.push(listener);
        // Immediate execution for initial state capture
        listener(this.events);

        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private emit() {
        this.listeners.forEach(l => l(this.events));
    }
}

export const eventStream = new EventStream();