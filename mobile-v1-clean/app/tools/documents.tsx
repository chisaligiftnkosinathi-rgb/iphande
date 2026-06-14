import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { fetchWithAuth } from '../../src/config/api';
import { useSteward } from '../../src/context/StewardContext';
import { ShareButton } from '../../src/components/ShareButton';
import { shareQuote } from '../../src/services/shareApi';
import { PageHeader } from '../../src/components/PageHeader';
import { FeatureLockedCard } from '../../src/components/FeatureLockedCard';

interface QuoteDocument {
    id: string;
    customer_name: string;
    service_description: string;
    amount?: number;
    total?: number;
    status: string;
    created_at: string;
}

export default function DocumentsScreen() {
    const { profile, canAccess } = useSteward();
    const router = useRouter();
    const [quotes, setQuotes] = useState<QuoteDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(false);

    const fetchDocuments = async () => {
        setLoading(true);
        if (!profile) return;
        try {
            const data = await fetchWithAuth(`/quotes/business/${profile.id}`);
            const sortedQuotes = (data || []).sort((a: QuoteDocument, b: QuoteDocument) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            setQuotes(sortedQuotes);
        } catch (error) {
            console.error("Fetch quotes error:", error);
            setFetchError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (profile?.id) {
            fetchDocuments();
        }
    }, [profile?.id]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-ZA', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'accepted': return styles.badgeAccepted;
            case 'sent': return styles.badgeSent;
            default: return styles.badgeDraft;
        }
    };

    const getStatusTextStyle = (status: string) => {
        if (status === 'draft') return styles.badgeTextDraft;
        if (status === 'sent') return styles.badgeTextSent;
        return styles.badgeTextAccepted;
    };

    if (!canAccess("quotes")) {
        return (
            <ScrollView style={styles.container}>
                <PageHeader title="Quotes & Invoices" subtitle="Professional Business Documents" />
                <View style={styles.subcontent}>
                    <FeatureLockedCard 
                        featureName="Documents" 
                        description="Send professional quotes, invoices, and receipts to customers. Download branded PDFs."
                        packName="Documents Pack" 
                    />
                </View>
            </ScrollView>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchDocuments} />}
        >
            <PageHeader 
                eyebrow="Steward Tools" 
                title="Documents Tracker" 
                subtitle="View saved quotes and business documents." 
            />

            <View style={styles.subcontent}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Quotes</Text>
                </View>

                {loading && quotes.length === 0 ? (
                    <ActivityIndicator size="large" color="#111827" style={{ marginVertical: 40 }} />
                ) : fetchError ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>Unable to load documents.</Text>
                        <TouchableOpacity style={styles.retryButton} onPress={fetchDocuments}>
                            <Text style={styles.retryButtonText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : quotes.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No documents yet.</Text>
                        <Text style={styles.emptySubtext}>Create a quote to begin your business record.</Text>
                    </View>
                ) : (
                    quotes.map((quote) => {
                        const amount = quote.total || quote.amount || 0;
                        const quoteIdPrefix = quote.id ? quote.id.split('-')[0].toUpperCase() : 'DRAFT';

                        return (
                            <View key={quote.id} style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <Text style={styles.docId}>IPH-{quoteIdPrefix}</Text>
                                    <View style={[styles.badge, getStatusStyle(quote.status)]}>
                                        <Text style={[styles.badgeText, getStatusTextStyle(quote.status)]}>
                                            {quote.status.toUpperCase()}
                                        </Text>
                                    </View>
                                </View>
                                <Text style={styles.customerName}>{quote.customer_name}</Text>
                                <Text style={styles.serviceDesc}>{quote.service_description || 'General Service'}</Text>
                                
                                <View style={styles.cardFooter}>
                                    <Text style={styles.docDate}>{formatDate(quote.created_at)}</Text>
                                    <Text style={styles.docAmount}>R {Number(amount).toFixed(2)}</Text>
                                </View>

                                <View style={styles.actionRow}>
                                    <TouchableOpacity
                                        style={[styles.actionButton, { flex: 1 }]}
                                        onPress={() => router.push(`/quotes/${quote.id}`)}
                                    >
                                        <Text style={styles.actionButtonText}>View Quote</Text>
                                    </TouchableOpacity>
                                    <ShareButton 
                                        fetchShareText={() => shareQuote(quote.id)}
                                        label=""
                                        style={styles.shareBtn}
                                    />
                                </View>
                            </View>
                        );
                    })
                )}

            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    subcontent: { padding: 24, paddingBottom: 60 },
    
    sectionHeader: { marginBottom: 16 },
    sectionTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 16 },
    
    emptyState: { padding: 32, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' },
    emptyText: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
    emptySubtext: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
    retryButton: { marginTop: 12, backgroundColor: '#111827', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
    retryButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },

    card: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 16 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    docId: { fontSize: 14, fontWeight: '700', color: '#6B7280' },
    badge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 12 },
    badgeDraft: { backgroundColor: '#F3F4F6' },
    badgeSent: { backgroundColor: '#DBEAFE' },
    badgeAccepted: { backgroundColor: '#D1FAE5' },
    badgeText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
    badgeTextDraft: { color: '#4B5563' },
    badgeTextSent: { color: '#1E40AF' },
    badgeTextAccepted: { color: '#065F46' },

    customerName: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 4 },
    serviceDesc: { fontSize: 14, color: '#4B5563', marginBottom: 16 },
    
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
    docDate: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
    docAmount: { fontSize: 16, fontWeight: '800', color: '#10B981' },

    actionButton: { backgroundColor: '#111827', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
    actionButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
    actionRow: { flexDirection: 'row', gap: 8 },
    shareBtn: { backgroundColor: '#F3F4F6', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});
