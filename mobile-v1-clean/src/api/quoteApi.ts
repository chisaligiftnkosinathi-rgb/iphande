import { fetchWithAuth } from '../../config/api';

export interface LineItem {
    name: string;
    description: string;
    quantity: number;
    unit: string;
    unit_price: number;
    category: 'labour' | 'materials' | 'travel' | 'other';
    line_total: number;
}

export interface QuoteOut {
    id: string;
    business_owner_id: string;
    customer_request_id?: string;
    customer_name: string;
    customer_phone?: string;
    description: string;
    amount: number;
    currency: string;
    terms?: string;
    status: 'draft' | 'issued' | 'accepted' | 'declined' | 'expired' | 'converted';
    share_token: string;
    created_at: string;
    sent_at?: string;
    accepted_at?: string;
    subtotal?: number;
    vat?: number;
    line_items?: LineItem[];
    structured_terms?: any;
    archetype_key?: string;
    business_line?: string;
    quote_template_version?: string;
}

export async function fetchMyQuotes(): Promise<QuoteOut[]> {
    return fetchWithAuth('/quotes/me');
}

export async function fetchQuoteDetail(id: string): Promise<QuoteOut> {
    return fetchWithAuth(`/quotes/${id}`);
}

export async function createQuote(payload: any): Promise<QuoteOut> {
    return fetchWithAuth('/quotes', {
        method: 'POST',
        body: JSON.stringify(payload)
    });
}

export async function acceptQuote(id: string): Promise<QuoteOut> {
    return fetchWithAuth(`/quotes/${id}/accept`, {
        method: 'POST'
    });
}

export async function publicFetchQuoteDetail(token: string): Promise<QuoteOut> {
    // Note: Since public endpoints don't need auth, we can use standard fetch
    // or fetchWithAuth (which handles auth headers if present but is safe to use anyway).
    // Let's use fetchWithAuth for consistency, as it handles API_BASE_URL resolution.
    return fetchWithAuth(`/public/quotes/${token}`);
}

export async function publicAcceptQuote(token: string): Promise<QuoteOut> {
    return fetchWithAuth(`/public/quotes/${token}/accept`, {
        method: 'POST'
    });
}
