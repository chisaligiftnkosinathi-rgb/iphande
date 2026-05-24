// Typed API client for iPhande mobile app
import { API_BASE_URL } from '../config/api';
import type {
    BusinessCategory,
    ContentGenerationResult,
    ContentPost,
    ContentReviewStatus,
    Opportunity,
    Profile,
    QuoteRequest,
    QuoteRequestCreate,
    QuoteRequestStatus,
} from '../types/api';
import type {
    ContinuityEvent,
    ContinuityEventGraph,
    ContinuityGraphDirection,
} from '../types/replay';

const REQUEST_TIMEOUT_MS = 12000;

function buildApiUrl(path: string): string {
    const base = API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`;
    const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
    const apiPath = normalizedPath.startsWith('api/v1/')
        ? normalizedPath.slice('api/v1/'.length)
        : normalizedPath;
    return `${base}${apiPath}`;
}

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
    if (!response.ok) throw new Error(`POST ${path} failed`);
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

// Business taxonomy
export async function fetchBusinessCategories(): Promise<Record<string, BusinessCategory>> {
    return apiGet<Record<string, BusinessCategory>>('business-categories');
}

export async function fetchProfile(profileId: string): Promise<Profile> {
    return apiGet<Profile>(`profiles/${profileId}`);
}

export async function fetchOpportunities(): Promise<Opportunity[]> {
    return apiGet<Opportunity[]>('opportunities');
}

export async function createProfile(payload: {
    name: string;
    providerType: string;
    businessType: string;
    location: string;
    bio: string;
    business_category_key?: string;
    business_line?: string;
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

export async function listQuoteRequests(): Promise<QuoteRequest[]> {
    return apiGet<QuoteRequest[]>('/api/v1/quote-requests');
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
