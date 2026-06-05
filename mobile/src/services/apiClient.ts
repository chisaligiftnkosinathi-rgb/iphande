// Typed API client for iPhande mobile app
import { buildApiUrl, buildRootApiUrl } from '../config/api';
import type {
    CommissionLedgerResponse,
    ContentGenerationResult,
    ContentPost,
    ContentReviewStatus,
    InventoryBalance,
    InventoryMovementRow,
    Opportunity,
    PaymentIntentReview,
    Profile,
    Quote,
    QuoteRequest,
    QuoteRequestCreate,
    QuoteRequestStatus
} from '../types/api';
import type {
    ContinuityEvent,
    ContinuityEventGraph,
    ContinuityGraphDirection,
} from '../types/replay';

const REQUEST_TIMEOUT_MS = 12000;

export async function apiGet<T>(path: string): Promise<T> {
    const url = buildApiUrl(path);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error(`GET ${url} failed with ${response.status}`);
        return response.json();
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            throw new Error(`GET ${url} timed out after ${REQUEST_TIMEOUT_MS}ms`);
        }
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
}

async function apiPost<TRequest, TResponse>(
    path: string,
    payload: TRequest
): Promise<TResponse> {
    const response = await fetch(buildApiUrl(path), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        let errorText = '';
        try {
            errorText = await response.text();
        } catch { }
        let errorJson;
        try {
            errorJson = JSON.parse(errorText);
        } catch { }
        // eslint-disable-next-line no-console
        console.error(`POST ${path} failed`, response.status, errorJson || errorText);

        let message = '';
        if (Array.isArray(errorJson?.detail)) {
            // FastAPI validation error array
            message = errorJson.detail.map((item: any) => {
                const loc = Array.isArray(item.loc) ? item.loc.join('.') : item.loc;
                return `${loc}: ${item.msg}`;
            }).join('\n');
        } else if (typeof errorJson?.detail === 'string') {
            message = errorJson.detail;
        } else if (typeof errorJson?.detail === 'object') {
            message = JSON.stringify(errorJson.detail);
        } else if (errorJson?.message) {
            message = errorJson.message;
        } else {
            message = errorText || `POST ${path} failed`;
        }
        throw new Error(`POST ${path} failed: ${response.status} ${message}`);
    }
    return response.json();
}

async function apiPatch<TRequest, TResponse>(
    path: string,
    payload: TRequest
): Promise<TResponse> {
    const response = await fetch(buildApiUrl(path), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`PATCH ${path} failed`);
    return response.json();
}

export const api = {
    async get<T>(path: string): Promise<{ data: T }> {
        return { data: await apiGet<T>(path) };
    },
};

export async function checkApiHealth(): Promise<{ ok: boolean; status: number; body?: unknown }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch(buildRootApiUrl('/health'), {
            signal: controller.signal,
        });
        let body: unknown;
        try {
            body = await response.json();
        } catch { }
        return { ok: response.ok, status: response.status, body };
    } finally {
        clearTimeout(timeoutId);
    }
}

// Business taxonomy
export async function fetchBusinessCategories(): Promise<any[]> {
    const raw = await apiGet<any>('business-categories');
    const categories = Array.isArray(raw)
        ? raw
        : Object.entries(raw).map(([key, value]: any) => ({
            key,
            ...value,
        }));
    return categories;
}

export async function fetchProfile(profileId: string): Promise<Profile> {
    return apiGet<Profile>(`profiles/${profileId}`);
}

export async function fetchProfileByOwner(ownerId: string): Promise<Profile> {
    return apiGet<Profile>(`profiles/by-owner/${ownerId}`);
}

export async function fetchOpportunities(): Promise<Opportunity[]> {
    return apiGet<Opportunity[]>('opportunities');
}

export async function createProfile(payload: {
    name: string;
    slug: string;
    email: string;
    providerType?: string;
    businessType?: string;
    location?: string;
    bio?: string;
    business_category_key?: string;
    business_line?: string;
    owner_id?: string;
}): Promise<Profile> {
    return apiPost<typeof payload, Profile>('profiles', payload);
}

export async function generateContentPost(payload: {
    business_owner_id?: string;
    owner_profile_id?: string;
    business_category_key: string;
    business_line: string;
    goal_key?: string;
    platform?: string;
    offer_details?: string;
    location?: string;
    contact_method?: string;
    tone?: string;
}): Promise<ContentGenerationResult> {
    return apiPost<typeof payload, ContentGenerationResult>('content-posts/generate', payload);
}

export async function listGeneratedContentPosts(params?: {
    ownerProfileId?: string;
    status?: ContentReviewStatus;
}): Promise<ContentPost[]> {
    const query = new URLSearchParams();
    if (params?.ownerProfileId) query.set('owner_profile_id', params.ownerProfileId);
    if (params?.status) query.set('status', params.status);
    const suffix = query.toString();
    return apiGet<ContentPost[]>(`content-posts${suffix ? `?${suffix}` : ''}`);
}

export async function approveContentPost(contentPostId: string): Promise<ContentPost> {
    return apiPost<{}, ContentPost>(`content-posts/${contentPostId}/approve`, {});
}

export async function rejectContentPost(contentPostId: string): Promise<ContentPost> {
    return apiPost<{}, ContentPost>(`content-posts/${contentPostId}/reject`, {});
}

export async function shareContentPost(contentPostId: string, channel = 'facebook'): Promise<ContentPost> {
    return apiPost<string, ContentPost>(`content-posts/${contentPostId}/mark-shared`, channel);
}

// Quote Request API
export async function createQuoteRequest(
    payload: QuoteRequestCreate
): Promise<QuoteRequest> {
    return apiPost<QuoteRequestCreate, QuoteRequest>(
        '/api/v1/quote-requests',
        payload
    );
}

export async function listQuoteRequests(params?: {
    businessOwnerId?: string;
    status?: QuoteRequestStatus;
}): Promise<QuoteRequest[]> {
    const query = new URLSearchParams();
    if (params?.businessOwnerId) query.set('business_owner_id', params.businessOwnerId);
    if (params?.status) query.set('status', params.status);
    const suffix = query.toString();
    return apiGet<QuoteRequest[]>(`/api/v1/quote-requests${suffix ? `?${suffix}` : ''}`);
}

export async function updateQuoteRequestStatus(
    quoteRequestId: string,
    status: QuoteRequestStatus
): Promise<QuoteRequest> {
    return apiPatch<{ status: QuoteRequestStatus }, QuoteRequest>(
        `/api/v1/quote-requests/${quoteRequestId}/status`,
        { status }
    );
}

export async function reviewQuoteRequest(quoteRequestId: string): Promise<QuoteRequest> {
    return apiPost<{}, QuoteRequest>(`/api/v1/quote-requests/${quoteRequestId}/review`, {});
}

export async function contactQuoteRequest(quoteRequestId: string): Promise<QuoteRequest> {
    return apiPost<{}, QuoteRequest>(`/api/v1/quote-requests/${quoteRequestId}/contact`, {});
}

export async function convertQuoteRequest(quoteRequestId: string): Promise<QuoteRequest> {
    return apiPost<{}, QuoteRequest>(`/api/v1/quote-requests/${quoteRequestId}/convert`, {});
}

export async function closeQuoteRequest(quoteRequestId: string): Promise<QuoteRequest> {
    return apiPost<{}, QuoteRequest>(`/api/v1/quote-requests/${quoteRequestId}/close`, {});
}

export async function submitApplicationForRequest(quoteRequestId: string): Promise<QuoteRequest> {
    return apiPost<{}, QuoteRequest>(`/api/v1/quote-requests/${quoteRequestId}/submit-application`, {});
}

export async function confirmSaleForRequest(quoteRequestId: string): Promise<QuoteRequest> {
    return apiPost<{}, QuoteRequest>(`/api/v1/quote-requests/${quoteRequestId}/confirm-sale`, {});
}

export async function uploadSaleEvidenceForRequest(
    quoteRequestId: string,
    providerReferenceNumber: string,
    evidenceType: string,
    fileUri: string,
    fileName: string,
    mimeType: string
): Promise<QuoteRequest> {
    const formData = new FormData();
    formData.append('provider_reference_number', providerReferenceNumber);
    formData.append('evidence_type', evidenceType);

    formData.append('evidence_file', {
        uri: fileUri,
        name: fileName,
        type: mimeType,
    } as any);

    const url = buildApiUrl(`/api/v1/quote-requests/${quoteRequestId}/upload-sale-evidence`);
    const response = await fetch(url, {
        method: 'POST',
        body: formData,
    });
    if (!response.ok) throw new Error(`POST /quote-requests/${quoteRequestId}/upload-sale-evidence failed`);
    return response.json();
}

export async function draftQuoteFromRequest(
    quoteRequestId: string,
    payload: {
        amount: string;
        currency?: string;
        service_description?: string;
        terms?: string;
    }
): Promise<Quote> {
    return apiPost<typeof payload, Quote>(`/api/v1/quote-requests/${quoteRequestId}/quotes`, payload);
}

export async function listPaymentIntentsForBusiness(
    businessOwnerId: string
): Promise<PaymentIntentReview[]> {
    return apiGet<PaymentIntentReview[]>(`/api/v1/payments/intents/business/${businessOwnerId}`);
}

export async function createPaymentIntentFromQuote(
    quoteId: string,
    payload: { provider_name: string; payer_reference?: string }
): Promise<PaymentIntentReview> {
    return apiPost<any, PaymentIntentReview>(`/api/v1/payments/intents`, {
        quote_id: quoteId,
        ...payload
    });
}

export async function verifyPaymentIntent(intentId: string): Promise<PaymentIntentReview> {
    return apiPost<{}, PaymentIntentReview>(`/api/v1/payments/intents/${intentId}/verify`, {});
}

export async function rejectPaymentIntent(intentId: string): Promise<PaymentIntentReview> {
    return apiPost<{}, PaymentIntentReview>(`/api/v1/payments/intents/${intentId}/reject`, {});
}

export async function issueReceipt(intentId: string): Promise<PaymentIntentReview> {
    return apiPost<{}, PaymentIntentReview>(`/api/v1/payments/intents/${intentId}/receipt`, {});
}

export async function uploadPaymentReceipt(
    intentId: string,
    fileUri: string,
    fileName: string,
    mimeType: string
): Promise<PaymentIntentReview> {
    const formData = new FormData();
    formData.append('receipt_file', {
        uri: fileUri,
        name: fileName,
        type: mimeType,
    } as any);

    const url = buildApiUrl(`/api/v1/payments/intents/${intentId}/receipt-upload`);
    const response = await fetch(url, {
        method: 'POST',
        body: formData,
        // Note: Do NOT set 'Content-Type' header here. Fetch will automatically set it to 'multipart/form-data' with the correct boundary.
    });
    if (!response.ok) throw new Error(`POST /payments/intents/${intentId}/receipt-upload failed`);
    return response.json();
}

// Replay API
export async function listContinuityEventsForBusiness(
    businessOwnerId: string
): Promise<ContinuityEvent[]> {
    return apiGet<ContinuityEvent[]>(`/api/v1/continuity-events/business/${businessOwnerId}`);
}

export async function getContinuityEvent(eventId: string): Promise<ContinuityEvent> {
    return apiGet<ContinuityEvent>(`/api/v1/continuity-events/${eventId}`);
}

export async function listContinuityEventChildren(eventId: string): Promise<ContinuityEvent[]> {
    return apiGet<ContinuityEvent[]>(`/api/v1/continuity-events/parent/${eventId}/children`);
}

export async function getContinuityEventGraph(
    eventId: string,
    direction: ContinuityGraphDirection = 'both',
    maxDepth = 5
): Promise<ContinuityEventGraph> {
    return apiGet<ContinuityEventGraph>(
        `/api/v1/continuity-events/${eventId}/graph?direction=${direction}&max_depth=${maxDepth}`
    );
}

export async function listContinuityEventsForEntity(entityId: string): Promise<ContinuityEvent[]> {
    return apiGet<ContinuityEvent[]>(`/api/v1/continuity-events/entity/${entityId}`);
}

// Inventory Ledger API
export async function listInventoryBalancesForBusiness(businessOwnerId: string): Promise<InventoryBalance[]> {
    return apiGet<InventoryBalance[]>(`/api/v1/inventory/business/${businessOwnerId}/balances`);
}

export async function addInventoryStock(itemId: string, quantity: number, notes?: string): Promise<void> {
    return apiPost<{ quantity: number; notes?: string }, void>(
        `/api/v1/inventory/items/${itemId}/add-stock`,
        { quantity, notes }
    );
}

export async function consumeInventoryStock(itemId: string, quantity: number, notes?: string): Promise<void> {
    return apiPost<{ quantity: number; notes?: string }, void>(
        `/api/v1/inventory/items/${itemId}/consume-stock`,
        { quantity, notes }
    );
}

export async function listInventoryReplay(itemId: string): Promise<InventoryMovementRow[]> {
    return apiGet<InventoryMovementRow[]>(`/api/v1/inventory/items/${itemId}/replay`);
}

// --- Lineage Registry API ---
export type LineageDefinition = {
    lineage_key: string;
    name: string;
    description?: string;
    capabilities: string[];
    workflow_order: string[];
    commission_pipeline_stages?: string[];
    evidence_types: string[];
    events: string[];
};

export async function getLineageDefinition(businessCategoryKey: string): Promise<LineageDefinition> {
    const response = await fetch(buildApiUrl(`/api/v1/lineages/${businessCategoryKey}`));
    if (!response.ok) {
        throw new Error(`GET /lineages/${businessCategoryKey} failed`);
    }
    const data = await response.json();
    return data.lineage;
}

export async function getCommissionLedger(businessOwnerId: string): Promise<CommissionLedgerResponse> {
    return apiGet<CommissionLedgerResponse>(`/api/v1/commissions/business/${businessOwnerId}/ledger`);
}
