# Onboarding Identity Observe Evidence (2026-06-01)

Stage: B - Observe
Command:
cd C:\Projects\iphande
Get-Content mobile\screens\OnboardingScreen.tsx
Get-Content mobile\src\auth\AuthContext.tsx
Get-Content mobile\src\services\apiClient.ts

## Raw Output
--- FILE: mobile/screens/OnboardingScreen.tsx ---
import { Picker } from '@react-native-picker/picker';
import React, { useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { StewardButton } from '../components/ui/StewardButton';
import { BUSINESS_ARCHETYPES } from '../data/businessArchetypes';
import { useAuth } from '../src/auth/AuthContext';
import theme from '../theme';


import { createProfile } from '../src/services/apiClient';

const OnboardingScreen: React.FC = () => {
    const { completeOnboarding, user } = useAuth() as any;
    const [stewardName, setStewardName] = useState('');
    const [businessName, setBusinessName] = useState('');
    const [archetypeKey, setArchetypeKey] = useState('');
    const [location, setLocation] = useState('');
    const [story, setStory] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleComplete = async () => {
        if (!user?.email) {
            setError('Missing email. Please sign in again.');
            return;
        }
        if (!stewardName || !businessName || !archetypeKey) {
            setError('Please fill all required fields.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const profile = await createProfile({
                name: businessName,
                email: user.email,
                providerType: '', // Optionally add provider type field
                businessType: '', // Optionally add business type field
                location,
                bio: story,
                business_category_key: archetypeKey,
                business_line: '', // Optionally add business line field
            });
            completeOnboarding(profile.id, archetypeKey, stewardName);
        } catch (e: any) {
            setError(e.message || 'Failed to create profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Let's set up your business home</Text>
            <Text style={styles.subtitle}>Who are you, steward?</Text>
            <TextInput
                style={styles.input}
                placeholder="Your Name (Steward)"
                value={stewardName}
                onChangeText={setStewardName}
            />
            <Text style={styles.subtitle}>What best describes your business?</Text>
            {Platform.OS === 'android' ? (
                <View style={styles.pickerWrapper}>
                    <Picker
                        selectedValue={archetypeKey}
                        onValueChange={setArchetypeKey}
                        style={styles.picker}
                    >
                        <Picker.Item label="Select archetype..." value="" />
                        {BUSINESS_ARCHETYPES.map((a) => (
                            <Picker.Item key={a.key} label={a.label} value={a.key} />
                        ))}
                    </Picker>
                </View>
            ) : (
                <TouchableOpacity style={styles.pickerWrapper}>
                    <Text style={styles.pickerText}>{
                        archetypeKey
                            ? BUSINESS_ARCHETYPES.find((a) => a.key === archetypeKey)?.label
                            : 'Select archetype...'
                    }</Text>
                </TouchableOpacity>
            )}
            <TextInput
                style={styles.input}
                placeholder="Business Name"
                value={businessName}
                onChangeText={setBusinessName}
            />
            <TextInput
                style={styles.input}
                placeholder="Location / Operating Area"
                value={location}
                onChangeText={setLocation}
            />
            <TextInput
                style={styles.input}
                placeholder="Short Business Story"
                value={story}
                onChangeText={setStory}
                multiline
                numberOfLines={3}
            />
            {error && <Text style={{ color: 'red', marginBottom: 8 }}>{error}</Text>}
            <StewardButton
                title={loading ? 'Creating...' : 'Continue'}
                variant="primary"
                onPress={handleComplete}
                style={styles.button}
                disabled={loading || !archetypeKey || !businessName || !stewardName}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.humanSpace.background,
        padding: theme.layout.spacing.xxl,
    },
    title: {
        ...theme.typography.display,
        marginBottom: theme.layout.spacing.md,
        textAlign: 'center',
    },
    subtitle: {
        ...theme.typography.body,
        marginBottom: theme.layout.spacing.lg,
        textAlign: 'center',
        color: theme.colors.structural.slate,
    },
    pickerWrapper: {
        width: 280,
        backgroundColor: theme.colors.humanSpace.surface,
        borderColor: theme.colors.structural.border,
        borderWidth: 1,
        borderRadius: theme.layout.radii.sm,
        marginBottom: theme.layout.spacing.lg,
        paddingHorizontal: theme.layout.spacing.md,
    },
    picker: {
        width: '100%',
        height: 44,
    },
    pickerText: {
        ...theme.typography.body,
        color: theme.colors.structural.slate,
        paddingVertical: theme.layout.spacing.md,
    },
    input: {
        width: 280,
        ...theme.typography.body,
        backgroundColor: theme.colors.humanSpace.surface,
        borderColor: theme.colors.structural.border,
        borderWidth: 1,
        borderRadius: theme.layout.radii.sm,
        padding: theme.layout.spacing.md,
        marginBottom: theme.layout.spacing.lg,
    },
    button: {
        width: 280,
        marginTop: theme.layout.spacing.md,
    },
});

export default OnboardingScreen;

--- FILE: mobile/src/auth/AuthContext.tsx ---
import {
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    reload,
    sendEmailVerification,
    signInWithEmailAndPassword,
    User,
} from 'firebase/auth';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { auth } from '../config/firebase';

interface AuthContextType {
    isAuthenticated: boolean;
    stewardId: string | null;
    profileId: string | null;
    selectedBusinessArchetypeKey: string | null;
    isOnboarded: boolean;
    emailVerified: boolean;
    stewardName: string | null;
    signUp: (email: string, password: string) => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    completeOnboarding: (profileId: string, archetypeKey: string, stewardName: string) => void;
    refreshUser: () => Promise<void>;
    user: any;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isOnboarded, setIsOnboarded] = useState(false);
    const [profileId, setProfileId] = useState<string | null>(null);
    const [selectedBusinessArchetypeKey, setSelectedBusinessArchetypeKey] = useState<string | null>(null);
    const [stewardName, setStewardName] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            // Reset onboarding state if user changes
            setIsOnboarded(false);
            setProfileId(null);
            setSelectedBusinessArchetypeKey(null);
        });
        return unsubscribe;
    }, []);

    const signUp = useCallback(async (email: string, password: string) => {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(cred.user);
        setUser(cred.user);
    }, []);

    const signIn = useCallback(async (email: string, password: string) => {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        setUser(cred.user);
    }, []);

    const signOut = useCallback(async () => {
        await firebaseSignOut(auth);
        setUser(null);
        setIsOnboarded(false);
        setProfileId(null);
        setSelectedBusinessArchetypeKey(null);
    }, []);

    const completeOnboarding = (profileId: string, archetypeKey: string, stewardName: string) => {
        setProfileId(profileId);
        setSelectedBusinessArchetypeKey(archetypeKey);
        setStewardName(stewardName);
        setIsOnboarded(true);
    };

    const refreshUser = useCallback(async () => {
        if (auth.currentUser) {
            await reload(auth.currentUser);
            setUser(auth.currentUser);
        }
    }, []);

    const isAuthenticated = !!user;
    const stewardId = user?.uid || null;
    const emailVerified = !!user?.emailVerified;

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated,
                stewardId,
                profileId,
                selectedBusinessArchetypeKey,
                isOnboarded,
                emailVerified,
                stewardName,
                signUp,
                signIn,
                signOut,
                completeOnboarding,
                refreshUser,
                user,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
    return ctx;
};

--- FILE: mobile/src/services/apiClient.ts ---
// Typed API client for iPhande mobile app
import { API_BASE_URL } from '../config/api';
import type {
    BusinessCategory,
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
    email: string;
    providerType?: string;
    businessType?: string;
    location?: string;
    bio?: string;
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
