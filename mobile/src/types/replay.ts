export type ActorType = 'system' | 'business_owner' | 'customer';

export type ContinuityEventType =
    | 'prompt_context_built'
    | 'content_generated'
    | 'content_created_manually'
    | 'content_updated'
    | 'content_deleted'
    | 'content_shared'
    | 'quote_request_received'
    | 'quote_request_status_updated'
    | 'entity_created'
    | 'entity_updated'
    | 'template_selected'
    | 'public_caption_composed'
    | 'platform_format_applied';

export interface ContinuityEvent {
    id: string;
    business_owner_id: string;
    event_type: ContinuityEventType;
    actor_type: ActorType;
    actor_id?: string;
    related_entity_type?: string;
    related_entity_id?: string;
    parent_event_id?: string;
    payload_json?: Record<string, any>;
    created_at: string;
    lineage_sequence?: number; // Preemptively added for future backend deterministic sequences
}

export type ContinuityGraphDirection = 'upstream' | 'downstream' | 'both';

export interface ContinuityGraphEdge {
    source_event_id: string;
    target_event_id: string;
}

export interface ContinuityEventGraph {
    root_event: ContinuityEvent;
    nodes: ContinuityEvent[];
    edges: ContinuityGraphEdge[];
    truncated: boolean;
    max_depth: number;
    cycle_detected: boolean;
    direction: ContinuityGraphDirection;
}
