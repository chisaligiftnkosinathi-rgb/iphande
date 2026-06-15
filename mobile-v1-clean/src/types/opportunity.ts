export type OpportunityStatus = 'open' | 'contacted' | 'quoted' | 'closed';

export interface OpportunityCreate {
    created_by_profile_id: string;
    title: string;
    description?: string;
    province: string;
    town_or_city: string;
    suburb_or_area?: string;
    latitude?: number | null;
    longitude?: number | null;
    category_key: string;
    service_needed: string;
    budget_amount?: string;
    contact_name: string;
    contact_phone: string;
}

export interface OpportunityUpdate {
    title?: string;
    description?: string;
    status?: OpportunityStatus;
    province?: string;
    town_or_city?: string;
    suburb_or_area?: string;
    latitude?: number | null;
    longitude?: number | null;
    category_key?: string;
    service_needed?: string;
    budget_amount?: string;
    contact_name?: string;
    contact_phone?: string;
}

export interface OpportunityOut {
    id: string;
    created_by_profile_id: string;
    title: string;
    description?: string;
    status: OpportunityStatus;
    province?: string;
    town_or_city?: string;
    suburb_or_area?: string;
    latitude?: number | null;
    longitude?: number | null;
    category_key?: string;
    service_needed?: string;
    budget_amount?: string;
    contact_name?: string;
    contact_phone?: string;
    created_at: string;
}
