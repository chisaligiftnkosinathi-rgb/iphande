import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { fetchMyQuotes, QuoteOut } from '../../src/services/quoteApi';

export default function QuotesScreen() {
    const router = useRouter();
    const [quotes, setQuotes] = useState<QuoteOut[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchQuotes = useCallback(async () => {
        try {
            const data = await fetchMyQuotes();
            setQuotes(data || []);
        } catch (error) {
            console.error("Fetch quotes error:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchQuotes();
    }, [fetchQuotes]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchQuotes();
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.kicker}>Proposals</Text>
                <Text style={styles.title}>Your Quotes</Text>
                <Text style={styles.subtitle}>Manage draft and sent quotes.</Text>
            </View>

            <ScrollView
                style={styles.listContainer}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {loading ? (
                    <ActivityIndicator size="large" color="#111827" style={{ marginTop: 40 }} />
                ) : quotes.length === 0 ? (
                    <Text style={{ textAlign: 'center', color: '#6B7280', marginTop: 40 }}>No quotes generated yet.</Text>
                ) : quotes.map((q) => (
                    <TouchableOpacity
                        key={q.id}
                        style={styles.card}
                        onPress={() => router.push(`/quotes/${q.id}`)}
                    >
                        <View style={styles.cardHeader}>
                            <Text style={styles.quoteId}>IPH-{q.id.split('-')[0].toUpperCase()}</Text>
                            <View style={[styles.badge, q.status === 'issued' ? styles.badgeSent : q.status === 'accepted' ? styles.badgeAccepted : styles.badgeDraft]}>
                                <Text style={[styles.badgeText, q.status === 'issued' ? styles.badgeTextSent : q.status === 'accepted' ? styles.badgeTextAccepted : styles.badgeTextDraft]}>
                                    {q.status}
                                </Text>
                            </View>
                        </View>
                        <Text style={styles.customerName}>{q.customer_name}</Text>
                        <Text style={styles.serviceText} numberOfLines={1}>{q.description || ''}</Text>
                        <View style={styles.cardFooter}>
                            <Text style={styles.amountText}>R {Number(q.amount || 0).toFixed(2)}</Text>
                            <Text style={styles.dateText}>{new Date(q.created_at).toLocaleDateString()}</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: { padding: 24, paddingTop: 48, backgroundColor: '#F9FAFB', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
    kicker: { fontSize: 14, fontWeight: '700', color: '#6B7280', marginBottom: 4 },
    title: { fontSize: 28, fontWeight: '800', color: '#111827', marginBottom: 8 },
    subtitle: { fontSize: 18, color: '#6B7280' },
    listContainer: { flex: 1, backgroundColor: '#FFFFFF' },
    listContent: { padding: 24, gap: 16 },
    card: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    quoteId: { fontSize: 14, fontWeight: '700', color: '#9CA3AF' },
    badge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 16 },
    badgeDraft: { backgroundColor: '#F3F4F6' },
    badgeSent: { backgroundColor: '#DBEAFE' },
    badgeAccepted: { backgroundColor: '#D1FAE5' },
    badgeText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
    badgeTextDraft: { color: '#4B5563' },
    badgeTextSent: { color: '#1E40AF' },
    badgeTextAccepted: { color: '#065F46' },
    customerName: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 4 },
    serviceText: { fontSize: 15, color: '#6B7280', marginBottom: 16 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 16 },
    amountText: { fontSize: 18, fontWeight: '800', color: '#111827' },
    dateText: { fontSize: 13, color: '#9CA3AF', fontWeight: '500' },
});
