export interface AdvertisementCreate {
    title: string;
    description?: string;
    category_key: string;
    province: string;
    town_or_city: string;
    suburb_or_area?: string;
    contact_name: string;
    contact_whatsapp: string;
    price_or_budget?: string;
    expires_at?: string;
}

export interface AdvertisementOut {
    id: string;
    title: string;
    description?: string;
    category_key: string;
    province: string;
    town_or_city: string;
    suburb_or_area?: string;
    contact_name: string;
    contact_whatsapp: string;
    price_or_budget?: string;
    payment_status: 'pending' | 'paid' | 'rejected';
    advert_status: 'pending_review' | 'active' | 'expired' | 'rejected';
    payment_reference?: string;
    created_at: string;
    expires_at: string;
}
