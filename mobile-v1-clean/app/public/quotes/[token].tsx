import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { publicFetchQuoteDetail, publicAcceptQuote, QuoteOut } from '../../../src/api/quoteApi';

export default function PublicQuoteDetailScreen() {
    const { token } = useLocalSearchParams();
    const router = useRouter();
    const [quote, setQuote] = useState<QuoteOut | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchQuote = async () => {
        try {
            if (typeof token !== 'string') return;
            const data = await publicFetchQuoteDetail(token);
            setQuote(data);
        } catch (error) {
            console.error("Fetch quote error:", error);
            Alert.alert("Error", "Could not load quote details. The link may be invalid or expired.");
            router.replace('/');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuote();
    }, [token]);

    const handleAcceptQuote = async () => {
        if (!quote || typeof token !== 'string') return;
        Alert.alert(
            "Accept Quote",
            "Are you sure you want to accept this quote? This will notify the service provider to start work.",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Accept", 
                    onPress: async () => {
                        try {
                            const updated = await publicAcceptQuote(token);
                            setQuote(updated);
                            Alert.alert("Success", "Quote accepted successfully. The service provider has been notified.");
                        } catch (error: any) {
                            Alert.alert("Error", error.message || "Failed to accept quote.");
                        }
                    } 
                }
            ]
        );
    };

    if (loading || !quote) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#111827" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.kicker}>Proposal Review</Text>
                <Text style={styles.title}>IPH-{quote.id.split('-')[0].toUpperCase()}</Text>
                <View style={[styles.badge, quote.status === 'issued' ? styles.badgeSent : quote.status === 'accepted' ? styles.badgeAccepted : styles.badgeDraft]}>
                    <Text style={[styles.badgeText, quote.status === 'issued' ? styles.badgeTextSent : quote.status === 'accepted' ? styles.badgeTextAccepted : styles.badgeTextDraft]}>
                        {quote.status.toUpperCase()}
                    </Text>
                </View>
            </View>

            <View style={styles.content}>
                <View style={styles.card}>
                    <Text style={styles.sectionHeading}>Customer Details</Text>
                    <Text style={styles.primaryText}>{quote.customer_name}</Text>
                    {quote.customer_phone ? <Text style={styles.secondaryText}>{quote.customer_phone}</Text> : null}

                    <View style={styles.divider} />

                    <Text style={styles.sectionHeading}>Service & Breakdown</Text>
                    <Text style={styles.primaryText}>{quote.description || 'General Service'}</Text>
                    
                    {quote.quote_template_version === 'QUOTE_V2' && quote.line_items && quote.line_items.length > 0 ? (
                        <View style={styles.lineItemsList}>
                            {quote.line_items.map((item, index) => (
                                <View key={index} style={styles.lineItemRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.lineItemName}>{item.name}</Text>
                                        {item.description ? <Text style={styles.lineItemDesc}>{item.description}</Text> : null}
                                        <Text style={styles.lineItemCategory}>Category: {item.category}</Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
                                        <Text style={styles.lineItemQty}>{item.quantity} {item.unit} @ R {item.unit_price.toFixed(2)}</Text>
                                        <Text style={styles.lineItemTotal}>R {item.line_total.toFixed(2)}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    ) : null}

                    <View style={styles.divider} />

                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total Amount</Text>
                        <Text style={styles.totalAmount}>R {quote.amount.toFixed(2)}</Text>
                    </View>
                </View>

                <View style={styles.actionSection}>
                    {quote.status !== 'accepted' && (
                        <TouchableOpacity style={styles.successButton} onPress={handleAcceptQuote}>
                            <Text style={styles.successButtonText}>Accept Quote</Text>
                        </TouchableOpacity>
                    )}
                    {quote.status === 'accepted' && (
                        <View style={styles.successMessage}>
                            <Text style={styles.successMessageText}>This quote has been accepted. The service provider will contact you shortly.</Text>
                        </View>
                    )}
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: { padding: 24, paddingTop: 48, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', alignItems: 'flex-start' },
    kicker: { fontSize: 14, fontWeight: '700', color: '#6B7280', marginBottom: 4 },
    title: { fontSize: 28, fontWeight: '800', color: '#111827', marginBottom: 8 },

    badge: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16 },
    badgeDraft: { backgroundColor: '#F3F4F6' },
    badgeSent: { backgroundColor: '#DBEAFE' },
    badgeAccepted: { backgroundColor: '#D1FAE5' },
    badgeText: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
    badgeTextDraft: { color: '#4B5563' },
    badgeTextSent: { color: '#1E40AF' },
    badgeTextAccepted: { color: '#065F46' },

    content: { padding: 24 },
    card: {
        backgroundColor: '#FFFFFF', padding: 24, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB',
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2, marginBottom: 24,
    },
    sectionHeading: { fontSize: 13, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 },
    primaryText: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 4 },
    secondaryText: { fontSize: 15, color: '#4B5563', lineHeight: 22 },
    divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 20 },
    lineItemsList: { marginTop: 10, gap: 12 },
    lineItemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', alignItems: 'flex-start' },
    lineItemName: { fontSize: 15, fontWeight: '700', color: '#111827' },
    lineItemDesc: { fontSize: 13, color: '#6B7280', marginTop: 2 },
    lineItemCategory: { fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', marginTop: 4, fontWeight: '600' },
    lineItemQty: { fontSize: 12, color: '#6B7280' },
    lineItemTotal: { fontSize: 14, fontWeight: '700', color: '#111827', marginTop: 2 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    totalLabel: { fontSize: 16, fontWeight: '600', color: '#4B5563' },
    totalAmount: { fontSize: 24, fontWeight: '800', color: '#111827' },
    actionSection: { gap: 12 },
    successButton: { backgroundColor: '#ECFDF5', paddingVertical: 16, borderRadius: 12, borderWidth: 1, borderColor: '#10B981', alignItems: 'center' },
    successButtonText: { color: '#065F46', fontWeight: '700', fontSize: 16 },
    successMessage: { backgroundColor: '#ECFDF5', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#10B981' },
    successMessageText: { color: '#065F46', fontSize: 15, textAlign: 'center' },
});
