import { useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { AppHeader } from '../components/ui/AppHeader';
import { RootTabParamList } from '../navigation';
import { useAuth } from '../src/auth/AuthContext';
import {
    closeQuoteRequest,
    confirmSaleForRequest,
    contactQuoteRequest,
    convertQuoteRequest,
    draftQuoteFromRequest,
    listQuoteRequests,
    reviewQuoteRequest,
    submitApplicationForRequest,
    uploadSaleEvidenceForRequest,
} from '../src/services/apiClient';
import type { QuoteRequest } from '../src/types/api';

type InboxNavigation = {
    navigate: <Name extends keyof RootTabParamList>(
        name: Name,
        params?: RootTabParamList[Name]
    ) => void;
};

const statusLabels: Record<string, string> = {
    quote_requested: 'Requested',
    quote_reviewed: 'Reviewed',
    quote_contacted: 'Contacted',
    quote_converted: 'Converted',
    quote_closed: 'Closed',
    new: 'Requested',
    contacted: 'Contacted',
    quoted: 'Reviewed',
    accepted: 'Converted',
    declined: 'Closed',
    closed: 'Closed',
    application_submitted: 'App Submitted',
    evidence_review_pending: 'Review Pending',
    sale_confirmed: 'Sale Confirmed',
};

const EVIDENCE_TYPES = [
    'policy_schedule',
    'welcome_letter',
    'provider_activation_notice',
    'commission_statement',
];

const QuoteRequestsDashboardScreen: React.FC = () => {
    const navigation = useNavigation<InboxNavigation>();
    const { stewardId } = useAuth() as any;
    const [requests, setRequests] = useState<QuoteRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [busyRequestId, setBusyRequestId] = useState<string | null>(null);
    const [quoteAmounts, setQuoteAmounts] = useState<Record<string, string>>({});
    const [quoteTerms, setQuoteTerms] = useState<Record<string, string>>({});
    const [providerRefs, setProviderRefs] = useState<Record<string, string>>({});
    const [evidenceTypes, setEvidenceTypes] = useState<Record<string, string>>({});
    const [error, setError] = useState<string | null>(null);

    const fetchRequests = useCallback(async () => {
        if (!stewardId) return;
        setLoading(true);
        setError(null);
        try {
            const data = await listQuoteRequests({ businessOwnerId: stewardId });
            setRequests(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load incoming requests');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchRequests();
    };

    const updateRequest = (updated: QuoteRequest) => {
        setRequests((current) =>
            current.map((request) => (request.id === updated.id ? updated : request))
        );
    };

    const runAction = async (
        requestId: string,
        action: (id: string) => Promise<QuoteRequest>
    ) => {
        try {
            setBusyRequestId(requestId);
            setError(null);
            const updated = await action(requestId);
            updateRequest(updated);
        } catch (err: any) {
            setError(err.message || 'Request transition failed');
        } finally {
            setBusyRequestId(null);
        }
    };

    const handleUploadEvidence = async (requestId: string) => {
        const ref = providerRefs[requestId] || '';
        const type = evidenceTypes[requestId] || 'policy_schedule';
        if (!ref.trim()) {
            setError('Add a provider reference before uploading evidence.');
            return;
        }

        try {
            const file = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*'],
                copyToCacheDirectory: true,
            });

            if (file.type === 'cancel') return;

            setBusyRequestId(requestId);
            setError(null);
            const updated = await uploadSaleEvidenceForRequest(
                requestId,
                ref.trim(),
                type,
                file.uri,
                file.name,
                file.mimeType || 'application/octet-stream'
            );
            updateRequest(updated);
        } catch (err: any) {
            setError(err.message || 'Provider evidence upload failed');
        } finally {
            setBusyRequestId(null);
        }
    };

    const renderRequest = (item: QuoteRequest) => {
        const busy = busyRequestId === item.id;
        const status = item.status;
        const canReview = status === 'quote_requested' || status === 'new';
        const canContact = status === 'quote_reviewed' || status === 'quoted';
        const canConvert = status === 'quote_contacted' || status === 'contacted';
        const canSubmitApp = status === 'quoted' || status === 'quote_reviewed' || status === 'contacted';
        const canUploadEvidence = status === 'application_submitted';
        const canConfirmSale = status === 'evidence_review_pending';
        const canClose = status !== 'quote_closed' && status !== 'closed';
        const quoteAmount = quoteAmounts[item.id] || '';
        const quoteTermsValue = quoteTerms[item.id] || '';

        const handleDraftQuote = async () => {
            if (!quoteAmount.trim()) {
                setError('Add an amount before drafting a quote.');
                return;
            }

            try {
                setBusyRequestId(item.id);
                setError(null);
                await draftQuoteFromRequest(item.id, {
                    amount: quoteAmount.trim(),
                    currency: 'ZAR',
                    service_description: item.service_needed || item.business_line,
                    terms: quoteTermsValue.trim() || undefined,
                });
                await fetchRequests();
            } catch (err: any) {
                setError(err.message || 'Quote draft failed');
            } finally {
                setBusyRequestId(null);
            }
        };

        return (
            <View key={item.id} style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.customer}>{item.customer_name}</Text>
                    <View style={styles.statusPill}>
                        <Text style={styles.statusText}>{statusLabels[item.status] || item.status}</Text>
                    </View>
                </View>

                <Text style={styles.phone}>{item.customer_phone}</Text>
                <Text style={styles.service}>{item.service_needed || 'No service specified'}</Text>
                {item.customer_location ? <Text style={styles.meta}>Area: {item.customer_location}</Text> : null}
                {item.preferred_date ? <Text style={styles.meta}>Preferred: {item.preferred_date}</Text> : null}
                {item.message ? <Text style={styles.message}>{item.message}</Text> : null}
                <Text style={styles.meta}>Line: {item.business_line}</Text>
                <Text style={styles.meta}>Requested: {new Date(item.created_at).toLocaleString()}</Text>

                <View style={styles.quoteBox}>
                    <Text style={styles.quoteTitle}>Draft quote</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Amount, e.g. 450.00"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="numeric"
                        value={quoteAmount}
                        onChangeText={(value) =>
                            setQuoteAmounts((current) => ({ ...current, [item.id]: value }))
                        }
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Terms, e.g. Valid for 7 days"
                        placeholderTextColor="#9CA3AF"
                        value={quoteTermsValue}
                        onChangeText={(value) =>
                            setQuoteTerms((current) => ({ ...current, [item.id]: value }))
                        }
                    />
                    <Pressable
                        style={[styles.draftButton, busy && styles.disabledButton]}
                        disabled={busy}
                        onPress={handleDraftQuote}
                    >
                        <Text style={styles.actionText}>Draft Quote</Text>
                    </Pressable>
                </View>

                <View style={styles.actionRow}>
                    <Pressable
                        style={[styles.actionButton, !canReview && styles.disabledButton]}
                        disabled={!canReview || busy}
                        onPress={() => runAction(item.id, reviewQuoteRequest)}
                    >
                        <Text style={styles.actionText}>Review</Text>
                    </Pressable>
                    <Pressable
                        style={[styles.actionButton, !canContact && styles.disabledButton]}
                        disabled={!canContact || busy}
                        onPress={() => runAction(item.id, contactQuoteRequest)}
                    >
                        <Text style={styles.actionText}>Contact</Text>
                    </Pressable>
                </View>

                <View style={styles.actionRow}>
                    <Pressable
                        style={[styles.actionButton, styles.convertButton, !canConvert && styles.disabledButton]}
                        disabled={!canConvert || busy}
                        onPress={() => runAction(item.id, convertQuoteRequest)}
                    >
                        <Text style={styles.actionText}>Convert</Text>
                    </Pressable>
                    <Pressable
                        style={[styles.actionButton, { backgroundColor: '#0284C7' }, !canSubmitApp && styles.disabledButton]}
                        disabled={!canSubmitApp || busy}
                        onPress={() => runAction(item.id, submitApplicationForRequest)}
                    >
                        <Text style={styles.actionText}>Submit App</Text>
                    </Pressable>
                    <Pressable
                        style={[styles.actionButton, styles.closeButton, !canClose && styles.disabledButton]}
                        disabled={!canClose || busy}
                        onPress={() => runAction(item.id, closeQuoteRequest)}
                    >
                        <Text style={styles.actionText}>Close</Text>
                    </Pressable>
                </View>

                {canUploadEvidence && (
                    <View style={styles.quoteBox}>
                        <Text style={styles.quoteTitle}>Upload Provider Evidence</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Provider Reference Number"
                            placeholderTextColor="#9CA3AF"
                            value={providerRefs[item.id] || ''}
                            onChangeText={(value) =>
                                setProviderRefs((current) => ({ ...current, [item.id]: value }))
                            }
                        />
                        <View style={styles.pillContainer}>
                            {EVIDENCE_TYPES.map(type => {
                                const isSelected = (evidenceTypes[item.id] || 'policy_schedule') === type;
                                return (
                                    <Pressable
                                        key={type}
                                        style={[styles.pill, isSelected && styles.pillSelected]}
                                        onPress={() => setEvidenceTypes(current => ({ ...current, [item.id]: type }))}
                                    >
                                        <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                                            {type.replace(/_/g, ' ').toUpperCase()}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                        <Pressable
                            style={[styles.actionButton, { backgroundColor: '#4F46E5', marginTop: 10 }]}
                            disabled={busy}
                            onPress={() => handleUploadEvidence(item.id)}
                        >
                            <Text style={styles.actionText}>Select File & Upload Proof</Text>
                        </Pressable>
                    </View>
                )}

                {canConfirmSale && (
                    <View style={styles.actionRow}>
                        <Pressable
                            style={[styles.actionButton, { backgroundColor: '#16A34A' }]}
                            disabled={busy}
                            onPress={() => runAction(item.id, confirmSaleForRequest)}
                        >
                            <Text style={styles.actionText}>Review & Confirm Sale</Text>
                        </Pressable>
                    </View>
                )}

                <Pressable
                    style={styles.replayButton}
                    onPress={() =>
                        navigation.navigate('EntityReplay', {
                            entityId: item.id,
                            entityType: 'quote_request',
                        })
                    }
                >
                    <Text style={styles.replayText}>Open request replay</Text>
                </Pressable>
            </View>
        );
    };

    return (
        <View style={{ flex: 1 }}>
            <AppHeader title="Quote Requests" />
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <View style={styles.headerCard}>
                    <Text style={styles.description}>
                        Review customer requests and preserve every response transition in replay.
                    </Text>
                    <Text style={styles.owner}>Owner: {stewardId}</Text>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color="#1E3A2F" style={{ marginTop: 40 }} />
                ) : error ? (
                    <Text style={styles.error}>{error}</Text>
                ) : requests.length === 0 ? (
                    <Text style={styles.empty}>No incoming requests found.</Text>
                ) : (
                    <>
                        {requests.map(renderRequest)}
                        <View style={styles.boundaryCard}>
                            <Text style={styles.boundaryTitle}>Truth Boundary</Text>
                            <Text style={styles.boundaryText}>
                                Quote created is not policy approval. Uploading evidence is not confirming evidence. A sale is confirmed only after human steward review.
                            </Text>
                        </View>
                    </>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAF7' },
    content: { padding: 20, gap: 14 },
    headerCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 18,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    eyebrow: { fontSize: 12, fontWeight: '900', color: '#2F6B4F', textTransform: 'uppercase', marginBottom: 6 },
    header: { fontSize: 28, fontWeight: '900', color: '#102A20', marginBottom: 8 },
    description: { fontSize: 14, lineHeight: 22, color: '#4B5563', marginBottom: 10 },
    owner: { fontSize: 12, fontWeight: '800', color: '#6B7280' },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    customer: { fontSize: 18, fontWeight: '900', color: '#14532D', flex: 1, marginRight: 10 },
    statusPill: { backgroundColor: '#DCFCE7', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
    statusText: { color: '#166534', fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
    phone: { fontSize: 13, color: '#111827', fontWeight: '800', marginBottom: 8 },
    service: { fontSize: 14, lineHeight: 22, color: '#374151', marginBottom: 8 },
    meta: { fontSize: 12, color: '#64748B', marginBottom: 4 },
    message: { fontSize: 13, lineHeight: 20, color: '#4B5563', backgroundColor: '#F9FAFB', padding: 10, borderRadius: 8, marginBottom: 8 },
    quoteBox: { backgroundColor: '#F9FAFB', borderRadius: 8, padding: 12, marginTop: 10 },
    quoteTitle: { fontSize: 12, color: '#374151', fontWeight: '900', textTransform: 'uppercase', marginBottom: 8 },
    input: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 13,
        color: '#111827',
        marginBottom: 8,
    },
    draftButton: { backgroundColor: '#0F766E', minHeight: 42, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    actionRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
    actionButton: { flex: 1, backgroundColor: '#1E3A2F', minHeight: 42, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    convertButton: { backgroundColor: '#111827' },
    closeButton: { backgroundColor: '#7F1D1D' },
    disabledButton: { backgroundColor: '#9CA3AF' },
    actionText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
    replayButton: { borderWidth: 1, borderColor: '#111827', minHeight: 42, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
    replayText: { color: '#111827', fontSize: 12, fontWeight: '900' },
    error: { color: '#B91C1C', fontWeight: '700', textAlign: 'center', marginTop: 30 },
    empty: { color: '#64748B', textAlign: 'center', marginTop: 30, fontWeight: '700' },
    boundaryCard: { backgroundColor: '#FEF2F2', borderRadius: 8, padding: 16, borderWidth: 1, borderColor: '#FCA5A5', marginTop: 10, marginBottom: 20 },
    boundaryTitle: { fontSize: 13, fontWeight: '900', color: '#991B1B', textTransform: 'uppercase', marginBottom: 6 },
    boundaryText: { fontSize: 12, lineHeight: 18, color: '#B91C1C', fontWeight: '800' },
    pillContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
    pill: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#374151',
    },
    pillSelected: { backgroundColor: '#111827', borderColor: '#111827' },
    pillText: { fontSize: 11, fontWeight: '700', color: '#111827' },
    pillTextSelected: { color: '#FFFFFF' },
});

export default QuoteRequestsDashboardScreen;
