import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { fetchWithAuth } from '../../src/config/api';

export default function NewQuoteScreen() {
    const { leadId, name, phone, service } = useLocalSearchParams<{ leadId: string, name: string, phone: string, service: string }>();
    const router = useRouter();

    const [labour, setLabour] = useState('');
    const [materials, setMaterials] = useState('');
    const [travel, setTravel] = useState('');
    const [other, setOther] = useState('');
    const [addVat, setAddVat] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const parseNum = (val: string) => parseFloat(val) || 0;

    const subtotal = parseNum(labour) + parseNum(materials) + parseNum(travel) + parseNum(other);
    const vat = addVat ? subtotal * 0.15 : 0;
    const total = subtotal + vat;

    const handleGenerateQuote = async () => {
        if (total <= 0) {
            Alert.alert("Invalid Quote", "The total amount must be greater than zero.");
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Save the Quote Record
            const quotePayload = {
                lead_id: leadId || null,
                customer_name: name || 'Unknown',
                customer_phone: phone || 'Unknown',
                service_description: service || '',
                labour: parseNum(labour),
                materials: parseNum(materials),
                travel: parseNum(travel),
                other: parseNum(other),
                subtotal,
                vat,
                total,
                status: 'draft'
            };

            await fetchWithAuth(`/quotes`, {
                method: 'POST',
                body: JSON.stringify(quotePayload)
            });

            // 2. Update the lead status to track progression in the pipeline
            if (leadId) {
                await fetchWithAuth(`/leads/${leadId}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ status: 'quoted' })
                });
            }

            Alert.alert(
                "Quote Generated",
                `Quote successfully saved for ${name || 'the customer'}.\nTotal: R ${total.toFixed(2)}\n\n(Next, we will connect this to the Document Creator.)`,
                [{ text: "Back to Leads", onPress: () => router.back() }]
            );
        } catch (error) {
            console.error("Failed to generate quote:", error);
            Alert.alert("Error", "Could not generate the quote at this time.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.kicker}>Estimator</Text>
                <Text style={styles.title}>Create Quote</Text>
                <Text style={styles.subtitle}>Draft a professional quote instantly.</Text>
            </View>

            <View style={styles.content}>
                {/* Lead Context Pre-fill */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Customer Details</Text>
                    <TextInput style={styles.inputReadOnly} value={name} editable={false} placeholder="Customer Name" />
                    <TextInput style={styles.inputReadOnly} value={phone} editable={false} placeholder="Phone Number" />
                    <TextInput style={styles.inputReadOnly} value={service} editable={false} placeholder="Service Needed" multiline />
                </View>

                {/* Calculator Inputs */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Cost Breakdown (ZAR)</Text>

                    <Text style={styles.label}>Labour / Service Fee</Text>
                    <TextInput style={styles.input} value={labour} onChangeText={setLabour} keyboardType="numeric" placeholder="R 0.00" />

                    <Text style={styles.label}>Materials / Parts</Text>
                    <TextInput style={styles.input} value={materials} onChangeText={setMaterials} keyboardType="numeric" placeholder="R 0.00" />

                    <Text style={styles.label}>Travel / Call-out Fee</Text>
                    <TextInput style={styles.input} value={travel} onChangeText={setTravel} keyboardType="numeric" placeholder="R 0.00" />

                    <Text style={styles.label}>Other Expenses</Text>
                    <TextInput style={styles.input} value={other} onChangeText={setOther} keyboardType="numeric" placeholder="R 0.00" />

                    <View style={styles.switchRow}>
                        <Text style={styles.label}>Include 15% VAT</Text>
                        <Switch value={addVat} onValueChange={setAddVat} />
                    </View>
                </View>

                {/* Live Receipt / Summary */}
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>Quote Summary</Text>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryText}>Subtotal</Text>
                        <Text style={styles.summaryValue}>R {subtotal.toFixed(2)}</Text>
                    </View>
                    {addVat && (
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryText}>VAT (15%)</Text>
                            <Text style={styles.summaryValue}>R {vat.toFixed(2)}</Text>
                        </View>
                    )}
                    <View style={styles.divider} />
                    <View style={styles.summaryRow}>
                        <Text style={styles.totalText}>Total</Text>
                        <Text style={styles.totalValue}>R {total.toFixed(2)}</Text>
                    </View>
                </View>

                {/* Action */}
                <TouchableOpacity
                    style={[styles.primaryButton, (isSubmitting || total <= 0) && styles.buttonDisabled]}
                    onPress={handleGenerateQuote}
                    disabled={isSubmitting || total <= 0}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.primaryButtonText}>Generate Quote</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: { padding: 24, paddingTop: 48, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
    kicker: { fontSize: 14, fontWeight: '700', color: '#6B7280', marginBottom: 4 },
    title: { fontSize: 28, fontWeight: '800', color: '#111827', marginBottom: 8 },
    subtitle: { fontSize: 18, color: '#6B7280' },
    content: { padding: 24, gap: 16, paddingBottom: 60 },
    card: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 },
    label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 8 },
    input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 14, fontSize: 16, color: '#111827' },
    inputReadOnly: { backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 14, fontSize: 16, color: '#6B7280', marginBottom: 12 },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB' },

    // Summary Box (Receipt style)
    summaryCard: { backgroundColor: '#111827', padding: 24, borderRadius: 12, marginTop: 8 },
    summaryTitle: { fontSize: 16, fontWeight: '700', color: '#9CA3AF', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    summaryText: { fontSize: 16, color: '#D1D5DB' },
    summaryValue: { fontSize: 16, color: '#FFFFFF', fontWeight: '500' },
    divider: { height: 1, backgroundColor: '#374151', marginVertical: 12 },
    totalText: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
    totalValue: { fontSize: 24, fontWeight: '800', color: '#10B981' },

    // Button
    primaryButton: { backgroundColor: '#10B981', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 16, shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
    primaryButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
    buttonDisabled: { opacity: 0.6 }
});
