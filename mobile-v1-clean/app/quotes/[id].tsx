import * as Print from 'expo-print';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { API_BASE_URL } from '../../config/api';
import { fetchQuoteDetail, acceptQuote, QuoteOut } from '../../src/api/quoteApi';
import { fetchWithAuth } from '../../config/api';
import { validateDocumentData } from '../../config/documentTemplates';
import { useSteward } from '../../src/state/StewardContext';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../../src/api/supabase';
import * as Clipboard from 'expo-clipboard';

export default function QuoteDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { profile } = useSteward();
    const [quote, setQuote] = useState<QuoteOut | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchQuote = async () => {
        try {
            if (typeof id !== 'string') return;
            const data = await fetchQuoteDetail(id);
            setQuote(data);
        } catch (error) {
            console.error("Fetch quote error:", error);
            Alert.alert("Error", "Could not load quote details.");
            router.back();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuote();
    }, [id]);

    const generateAndSharePDF = async () => {
        if (!quote) return;
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            if (!token) throw new Error("No auth token available");

            // @ts-ignore
            const fileUri = FileSystem.documentDirectory + `Quote_IPH-${quote.id.split('-')[0].toUpperCase()}.pdf`;
            
            const downloadRes = await FileSystem.downloadAsync(
                `${API_BASE_URL}/documents/quotes/${quote.id}/pdf`,
                fileUri,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (downloadRes.status !== 200) {
                 throw new Error("Could not download PDF from server");
            }

            const isSharingAvailable = await Sharing.isAvailableAsync();
            if (isSharingAvailable) {
                await Sharing.shareAsync(downloadRes.uri, { UTI: '.pdf', mimeType: 'application/pdf' });
            } else {
                Alert.alert("Sharing unavailable", "PDF generated successfully, but sharing is not supported on this device/browser.");
            }
        } catch (error) {
            console.error('Error generating PDF:', error);
            Alert.alert('Error', 'Could not generate the PDF.');
        }
    };

    const handleConvertToInvoice = async () => {
        if (!quote) return;
        try {
            await fetchWithAuth(`/invoices/from-quote/${quote.id}`, { method: 'POST' });
            Alert.alert("Success", "Invoice created successfully.");
            router.push('/tools/documents');
        } catch (error: any) {
            console.error('Error converting to invoice:', error);
            Alert.alert('Error', error.message || 'Could not convert quote to invoice.');
        }
    };

    const handleStartWork = () => {
        Alert.alert(
            "Accept Quote",
            "Marking this quote as accepted will update the pipeline and move the job to 'Work Started'.",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Confirm", onPress: () => router.push(`/jobs/${id}/proof`) }
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
                    <Text style={styles.secondaryText}>{quote.customer_phone}</Text>

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
                    ) : (
                        <Text style={styles.secondaryText}>
                            Total: R {quote.amount.toFixed(2)}
                        </Text>
                    )}

                    <View style={styles.divider} />

                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total Amount</Text>
                        <Text style={styles.totalAmount}>R {quote.amount.toFixed(2)}</Text>
                    </View>
                </View>

                {(() => {
                    const planning = quote.structured_terms?.planning || {};
                    const hasPlanning = 
                        (planning.expected_labour_hours !== null && planning.expected_labour_hours !== undefined && planning.expected_labour_hours !== '') ||
                        (planning.expected_travel_km !== null && planning.expected_travel_km !== undefined && planning.expected_travel_km !== '') ||
                        (planning.expected_material_cost !== null && planning.expected_material_cost !== undefined && planning.expected_material_cost !== '') ||
                        (planning.expected_notes !== null && planning.expected_notes !== undefined && planning.expected_notes !== '');

                    if (!hasPlanning) return null;

                    return (
                        <View style={styles.card}>
                            <Text style={styles.sectionHeading}>Planning & Scope Details</Text>
                            <View style={{ gap: 8, marginTop: 8 }}>
                                {planning.expected_labour_hours !== null && planning.expected_labour_hours !== undefined && planning.expected_labour_hours !== '' && (
                                    <Text style={styles.secondaryText}>
                                        • <Text style={{ fontWeight: '700' }}>Expected Labour:</Text> {planning.expected_labour_hours} hours
                                    </Text>
                                )}
                                {planning.expected_travel_km !== null && planning.expected_travel_km !== undefined && planning.expected_travel_km !== '' && (
                                    <Text style={styles.secondaryText}>
                                        • <Text style={{ fontWeight: '700' }}>Expected Travel:</Text> {planning.expected_travel_km} km
                                    </Text>
                                )}
                                {planning.expected_material_cost !== null && planning.expected_material_cost !== undefined && planning.expected_material_cost !== '' && (
                                    <Text style={styles.secondaryText}>
                                        • <Text style={{ fontWeight: '700' }}>Expected Material Cost:</Text> R {Number(planning.expected_material_cost).toFixed(2)}
                                    </Text>
                                )}
                                {planning.expected_notes !== null && planning.expected_notes !== undefined && planning.expected_notes !== '' ? (
                                    <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12 }}>
                                        <Text style={[styles.sectionHeading, { fontSize: 11 }]}>Planning Notes</Text>
                                        <Text style={[styles.secondaryText, { fontStyle: 'italic' }]}>{planning.expected_notes}</Text>
                                    </View>
                                ) : null}
                            </View>
                        </View>
                    );
                })()}

                <View style={styles.actionSection}>
                    <TouchableOpacity style={styles.primaryButton} onPress={generateAndSharePDF}>
                        <Text style={styles.primaryButtonText}>Share PDF via WhatsApp</Text>
                    </TouchableOpacity>

                    {quote.status !== 'accepted' && (
                        <TouchableOpacity style={styles.successButton} onPress={handleStartWork}>
                            <Text style={styles.successButtonText}>Accept Quote & Start Work</Text>
                        </TouchableOpacity>
                    )}

                    {quote.status === 'accepted' && (
                        <TouchableOpacity style={styles.secondaryButton} onPress={handleConvertToInvoice}>
                            <Text style={styles.secondaryButtonText}>Convert to Invoice</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
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
        backgroundColor: '#FFFFFF',
        padding: 24,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
        marginBottom: 24,
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
    primaryButton: {
        backgroundColor: '#111827', paddingVertical: 16, borderRadius: 12, alignItems: 'center',
    },
    primaryButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
    successButton: {
        backgroundColor: '#ECFDF5', paddingVertical: 16, borderRadius: 12, borderWidth: 1, borderColor: '#10B981', alignItems: 'center',
    },
    successButtonText: { color: '#065F46', fontWeight: '700', fontSize: 16 },
    secondaryButton: {
        backgroundColor: '#FFFFFF', paddingVertical: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center',
    },
    secondaryButtonText: { color: '#111827', fontWeight: '700', fontSize: 16 },
});
