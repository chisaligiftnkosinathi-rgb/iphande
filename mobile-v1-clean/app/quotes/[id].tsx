import * as Print from 'expo-print';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { fetchWithAuth } from '../../src/config/api';
import { validateDocumentData } from '../../src/config/documentTemplates';
import { useSteward } from '../../src/context/StewardContext';

interface LineItem {
    name: string;
    description: string;
    quantity: number;
    unit: string;
    unit_price: number;
    category: 'labour' | 'materials' | 'travel' | 'other';
    line_total: number;
}

interface QuoteDetail {
    id: string;
    customer_name: string;
    customer_phone: string;
    service_description: string;
    labour: number;
    materials: number;
    travel: number;
    other: number;
    subtotal: number;
    vat: number;
    total: number;
    status: string;
    created_at: string;
    // V2 fields
    line_items?: LineItem[];
    archetype_key?: string;
    business_line?: string;
    quote_template_version?: string;
    structured_terms?: any;
}

export default function QuoteDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { profile } = useSteward();
    const [quote, setQuote] = useState<QuoteDetail | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchQuote = async () => {
        try {
            // Fetching from /me and filtering is a safe V1 approach if GET /{id} isn't exposed yet
            const data = await fetchWithAuth('/quotes/me');
            const found = data?.find((q: QuoteDetail) => q.id === id);
            if (found) setQuote(found);
            else throw new Error("Quote not found");
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

        // Enforce the Template Law: Ensure the Truth satisfies the requirements
        const templateKey = quote.quote_template_version === 'QUOTE_V2' ? 'QUOTE_V2' : 'QUOTE_V1';
        const missingFields = validateDocumentData(templateKey, quote);
        if (missingFields.length > 0) {
            Alert.alert("Incomplete Data", `Cannot generate document. Missing required fields: ${missingFields.join(', ')}`);
            return;
        }

        const businessName = profile?.businessName || profile?.name || 'iPhande Steward';

        let tableRowsHtml = '';
        if (quote.quote_template_version === 'QUOTE_V2' && quote.line_items && quote.line_items.length > 0) {
            tableRowsHtml = `
                <thead>
                    <tr>
                        <th style="padding: 12px; background-color: #F9FAFB; color: #4B5563; font-weight: 700; font-size: 12px; text-transform: uppercase;">Item</th>
                        <th style="padding: 12px; background-color: #F9FAFB; color: #4B5563; font-weight: 700; font-size: 12px; text-transform: uppercase;">Category</th>
                        <th style="padding: 12px; background-color: #F9FAFB; color: #4B5563; font-weight: 700; font-size: 12px; text-transform: uppercase; text-align: right;">Qty</th>
                        <th style="padding: 12px; background-color: #F9FAFB; color: #4B5563; font-weight: 700; font-size: 12px; text-transform: uppercase;">Unit</th>
                        <th style="padding: 12px; background-color: #F9FAFB; color: #4B5563; font-weight: 700; font-size: 12px; text-transform: uppercase; text-align: right;">Price</th>
                        <th style="padding: 12px; background-color: #F9FAFB; color: #4B5563; font-weight: 700; font-size: 12px; text-transform: uppercase; text-align: right;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${quote.line_items.map(item => `
                        <tr>
                            <td style="padding: 12px; border-bottom: 1px solid #E5E7EB;">
                                <div style="font-weight: 600; font-size: 14px;">${item.name}</div>
                                ${item.description ? `<div style="font-size: 11px; color: #6B7280; margin-top: 2px;">${item.description}</div>` : ''}
                            </td>
                            <td style="padding: 12px; border-bottom: 1px solid #E5E7EB; text-transform: capitalize; font-size: 13px; color: #4B5563;">${item.category}</td>
                            <td style="padding: 12px; border-bottom: 1px solid #E5E7EB; text-align: right; font-size: 13px;">${item.quantity}</td>
                            <td style="padding: 12px; border-bottom: 1px solid #E5E7EB; font-size: 13px; color: #6B7280;">${item.unit}</td>
                            <td style="padding: 12px; border-bottom: 1px solid #E5E7EB; text-align: right; font-size: 13px;">R ${item.unit_price.toFixed(2)}</td>
                            <td style="padding: 12px; border-bottom: 1px solid #E5E7EB; text-align: right; font-weight: 600; font-size: 13px;">R ${item.line_total.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                    <tr><td colspan="6" style="border-bottom: none; height: 20px;"></td></tr>
                    <tr>
                        <td colspan="4" style="border: none; padding: 8px 12px;"></td>
                        <td style="border: none; padding: 8px 12px; font-weight: 600;">Subtotal</td>
                        <td style="border: none; padding: 8px 12px; text-align: right; font-weight: 600;">R ${quote.subtotal.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td colspan="4" style="border: none; padding: 8px 12px;"></td>
                        <td style="border: none; padding: 8px 12px; color: #4B5563;">VAT (15%)</td>
                        <td style="border: none; padding: 8px 12px; text-align: right; color: #4B5563;">R ${quote.vat.toFixed(2)}</td>
                    </tr>
                    <tr class="total-row">
                        <td colspan="4" style="border: none; padding: 8px 12px;"></td>
                        <td style="border-top: 2px solid #111827; padding: 12px; font-weight: 800; font-size: 18px;">TOTAL</td>
                        <td style="border-top: 2px solid #111827; padding: 12px; text-align: right; font-weight: 800; font-size: 18px; color: #10B981;">R ${quote.total.toFixed(2)}</td>
                    </tr>
                </tbody>
            `;
        } else {
            tableRowsHtml = `
                <thead>
                    <tr>
                        <th style="padding: 12px; background-color: #F9FAFB; color: #4B5563; font-weight: 700;">Description</th>
                        <th style="padding: 12px; background-color: #F9FAFB; color: #4B5563; font-weight: 700; text-align: right;">Amount (ZAR)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td style="padding: 12px; border-bottom: 1px solid #E5E7EB;">Labour / Service Fee</td><td style="padding: 12px; border-bottom: 1px solid #E5E7EB; text-align: right;">R ${quote.labour.toFixed(2)}</td></tr>
                    <tr><td style="padding: 12px; border-bottom: 1px solid #E5E7EB;">Materials / Parts</td><td style="padding: 12px; border-bottom: 1px solid #E5E7EB; text-align: right;">R ${quote.materials.toFixed(2)}</td></tr>
                    <tr><td style="padding: 12px; border-bottom: 1px solid #E5E7EB;">Travel / Call-out</td><td style="padding: 12px; border-bottom: 1px solid #E5E7EB; text-align: right;">R ${quote.travel.toFixed(2)}</td></tr>
                    <tr><td style="padding: 12px; border-bottom: 1px solid #E5E7EB;">Other Expenses</td><td style="padding: 12px; border-bottom: 1px solid #E5E7EB; text-align: right;">R ${quote.other.toFixed(2)}</td></tr>
                    <tr><td colspan="2" style="border-bottom: none; height: 20px;"></td></tr>
                    <tr>
                        <td style="border: none; padding: 8px 12px; font-weight: 600;">Subtotal</td>
                        <td style="border: none; padding: 8px 12px; text-align: right; font-weight: 600;">R ${quote.subtotal.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td style="border: none; padding: 8px 12px; color: #4B5563;">VAT (15%)</td>
                        <td style="border: none; padding: 8px 12px; text-align: right; color: #4B5563;">R ${quote.vat.toFixed(2)}</td>
                    </tr>
                    <tr class="total-row">
                        <td style="border-top: 2px solid #111827; padding: 12px; font-weight: 800; font-size: 18px;">TOTAL</td>
                        <td style="border-top: 2px solid #111827; padding: 12px; text-align: right; font-weight: 800; font-size: 18px; color: #10B981;">R ${quote.total.toFixed(2)}</td>
                    </tr>
                </tbody>
            `;
        }

        const html = `
            <html>
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
                    <style>
                        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #111827; }
                        .header { text-align: center; margin-bottom: 40px; }
                        .kicker { font-size: 14px; color: #6B7280; letter-spacing: 1px; text-transform: uppercase; font-weight: bold; }
                        .title { font-size: 32px; font-weight: 800; margin: 8px 0; }
                        .info-row { margin-bottom: 8px; font-size: 16px; }
                        .table { width: 100%; border-collapse: collapse; margin-top: 30px; }
                        .table th, .table td { text-align: left; }
                        .footer { margin-top: 60px; text-align: center; color: #9CA3AF; font-size: 14px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="kicker">${businessName}</div>
                        <div class="title">IPH-${quote.id.split('-')[0].toUpperCase()}</div>
                        <div style="color: #6B7280;">Date: ${new Date(quote.created_at).toLocaleDateString()}</div>
                    </div>

                    <div class="info-row"><strong>Customer:</strong> ${quote.customer_name}</div>
                    <div class="info-row"><strong>Phone:</strong> ${quote.customer_phone}</div>
                    <div class="info-row"><strong>Service:</strong> ${quote.service_description}</div>

                    <table class="table">
                        ${tableRowsHtml}
                    </table>

                    ${(() => {
                        const planning = quote.structured_terms?.planning || {};
                        const hasPlanning = 
                            (planning.expected_labour_hours !== null && planning.expected_labour_hours !== undefined && planning.expected_labour_hours !== '') ||
                            (planning.expected_travel_km !== null && planning.expected_travel_km !== undefined && planning.expected_travel_km !== '') ||
                            (planning.expected_material_cost !== null && planning.expected_material_cost !== undefined && planning.expected_material_cost !== '') ||
                            (planning.expected_notes !== null && planning.expected_notes !== undefined && planning.expected_notes !== '');

                        if (!hasPlanning) return '';

                        return `
                            <div style="margin-top: 40px; padding: 20px; background-color: #F9FAFB; border-radius: 12px; border: 1px solid #E5E7EB;">
                                <div style="font-weight: 800; font-size: 16px; margin-bottom: 12px; color: #111827; text-transform: uppercase; letter-spacing: 0.5px;">Planning & Scope Summary</div>
                                <ul style="padding-left: 20px; margin: 0; color: #4B5563; font-size: 14px; line-height: 20px;">
                                    ${planning.expected_labour_hours !== null && planning.expected_labour_hours !== undefined && planning.expected_labour_hours !== '' ? `<li><strong>Expected Labour:</strong> ${planning.expected_labour_hours} hours</li>` : ''}
                                    ${planning.expected_travel_km !== null && planning.expected_travel_km !== undefined && planning.expected_travel_km !== '' ? `<li><strong>Expected Travel:</strong> ${planning.expected_travel_km} km</li>` : ''}
                                    ${planning.expected_material_cost !== null && planning.expected_material_cost !== undefined && planning.expected_material_cost !== '' ? `<li><strong>Expected Material Cost:</strong> R ${Number(planning.expected_material_cost).toFixed(2)}</li>` : ''}
                                </ul>
                                ${planning.expected_notes ? `
                                    <div style="margin-top: 12px; font-size: 13px; color: #6B7280; font-style: italic; border-top: 1px solid #E5E7EB; padding-top: 8px;">
                                        <strong>Planning Notes:</strong><br/>
                                        ${planning.expected_notes}
                                    </div>
                                ` : ''}
                            </div>
                        `;
                    })()}

                    <div class="footer">
                        Generated securely via iPhande Steward Operating System.<br/>
                        Valid for 30 days from date of issue.
                    </div>
                </body>
            </html>
        `;

        try {
            const printResult = await Print.printToFileAsync({ html });
            const uri = printResult?.uri;
            if (!uri) {
                Alert.alert("PDF Unavailable", "PDF preview is not available on this platform. Please test PDF export on Android.");
                return;
            }
            const isSharingAvailable = await Sharing.isAvailableAsync();
            if (isSharingAvailable) {
                await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
            } else {
                Alert.alert("Sharing unavailable", "PDF generated successfully, but sharing is not supported on this device/browser.");
            }
        } catch (error) {
            console.error('Error generating PDF:', error);
            Alert.alert('Error', 'Could not generate the PDF.');
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
                <View style={[styles.badge, quote.status === 'sent' ? styles.badgeSent : quote.status === 'accepted' ? styles.badgeAccepted : styles.badgeDraft]}>
                    <Text style={[styles.badgeText, quote.status === 'sent' ? styles.badgeTextSent : quote.status === 'accepted' ? styles.badgeTextAccepted : styles.badgeTextDraft]}>
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
                    <Text style={styles.primaryText}>{quote.service_description || 'General Service'}</Text>
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
                            • Labour: R {quote.labour.toFixed(2)}{'\n'}
                            • Materials: R {quote.materials.toFixed(2)}{'\n'}
                            • Travel: R {quote.travel.toFixed(2)}{'\n'}
                            • Other: R {quote.other.toFixed(2)}
                        </Text>
                    )}

                    <View style={styles.divider} />

                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total Amount</Text>
                        <Text style={styles.totalAmount}>R {quote.total.toFixed(2)}</Text>
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
