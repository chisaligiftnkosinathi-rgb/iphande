import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform } from 'react-native';
import { fetchWithAuth } from '../../src/config/api';
import { useSteward } from '../../src/context/StewardContext';
import { PageHeader } from '../../src/components/PageHeader';

export default function KMTrackerScreen() {
    const router = useRouter();
    const { profile } = useSteward();
    const [loading, setLoading] = useState(false);

    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [purpose, setPurpose] = useState('');
    const [customerJob, setCustomerJob] = useState('');
    const [vehicle, setVehicle] = useState('');
    const [startKm, setStartKm] = useState('');
    const [endKm, setEndKm] = useState('');
    const [notes, setNotes] = useState('');

    const start = parseFloat(startKm);
    const end = parseFloat(endKm);
    const distance = (!isNaN(start) && !isNaN(end)) ? end - start : 0;
    const isError = !isNaN(start) && !isNaN(end) && distance < 0;

    const handleSave = async () => {
        if (!startKm || !endKm || !purpose) {
            Alert.alert("Missing Fields", "Please enter at least Purpose, Start KM, and End KM.");
            return;
        }

        if (isError) {
            Alert.alert("Invalid Data", "End KM cannot be less than Start KM.");
            return;
        }

        if (!profile?.id) {
            Alert.alert("Profile not ready", "Please wait for your steward profile to load.");
            return;
        }

        setLoading(true);

        try {
            const payloadBody = {
                business_owner_id: profile?.id,
                business_category_key: profile?.business_category_key,
                business_line: profile?.business_line,
                event_type: "entity_created",
                actor_type: "business_owner",
                actor_id: profile?.id,
                related_entity_type: "km_entry",
                related_entity_id: profile?.id,
                payload_json: {
                    surface: "km_tracker",
                    capture_type: "KM Log",
                    title: `Travel: ${distance.toFixed(1)} km`,
                    description: purpose,
                    date: date,
                    customer_job: customerJob,
                    vehicle: vehicle,
                    start_km: start,
                    end_km: end,
                    distance: distance,
                    notes: notes
                }
            };

            await fetchWithAuth('/continuity-events/', {
                method: 'POST',
                body: JSON.stringify(payloadBody)
            });

            Alert.alert(
                "Record saved", 
                "Your KM log has been preserved to the Continuity Ledger.",
                [{ text: "OK", onPress: () => router.back() }]
            );
        } catch (error) {
            console.error("KM Tracker Error:", error);
            Alert.alert("Error", "Failed to preserve record. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
            <PageHeader 
                eyebrow="Steward Tools" 
                title="KM Tracker" 
                subtitle="Track business trips and travel evidence securely." 
            />

            <View style={styles.content}>
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Trip Details</Text>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Date</Text>
                        <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Purpose</Text>
                        <TextInput style={styles.input} value={purpose} onChangeText={setPurpose} placeholder="e.g. Client site visit" />
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Customer / Job</Text>
                        <TextInput style={styles.input} value={customerJob} onChangeText={setCustomerJob} placeholder="e.g. Job #IPH-123" />
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Vehicle</Text>
                        <TextInput style={styles.input} value={vehicle} onChangeText={setVehicle} placeholder="e.g. Company Bakkie" />
                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Distance Ledger</Text>
                    <Text style={styles.formulaHelper}>Formula: End KM − Start KM</Text>
                    
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <View style={[styles.fieldGroup, { flex: 1 }]}>
                            <Text style={styles.label}>Start KM</Text>
                            <TextInput 
                                style={styles.input} 
                                value={startKm} 
                                onChangeText={setStartKm} 
                                placeholder="0" 
                                keyboardType="numeric" 
                            />
                        </View>
                        <View style={[styles.fieldGroup, { flex: 1 }]}>
                            <Text style={styles.label}>End KM</Text>
                            <TextInput 
                                style={styles.input} 
                                value={endKm} 
                                onChangeText={setEndKm} 
                                placeholder="0" 
                                keyboardType="numeric" 
                            />
                        </View>
                    </View>

                    <View style={styles.derivedBox}>
                        <Text style={styles.derivedLabel}>Total Distance</Text>
                        <Text style={[styles.derivedValue, isError && styles.errorText]}>
                            {(!isNaN(start) && !isNaN(end)) ? `${distance.toFixed(1)} km` : "—"}
                        </Text>
                        {isError && (
                            <Text style={styles.errorSubtext}>End KM cannot be less than Start KM.</Text>
                        )}
                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Additional Information</Text>
                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Notes</Text>
                        <TextInput 
                            style={[styles.input, styles.textArea]} 
                            value={notes} 
                            onChangeText={setNotes} 
                            placeholder="Add any contextual notes here..." 
                            multiline 
                            numberOfLines={4} 
                        />
                    </View>
                </View>

                <TouchableOpacity 
                    style={[styles.primaryButton, loading && styles.buttonDisabled]} 
                    onPress={handleSave}
                    disabled={loading}
                >
                    <Text style={styles.primaryButtonText}>
                        {loading ? "Preserving..." : "Save to Timeline"}
                    </Text>
                </TouchableOpacity>
            </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    content: { padding: 24, paddingBottom: 60 },
    card: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 24 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 16 },
    formulaHelper: { fontSize: 13, color: '#6B7280', marginBottom: 16, fontStyle: 'italic' },
    fieldGroup: { marginBottom: 16 },
    label: { fontSize: 14, fontWeight: '600', color: '#4B5563', marginBottom: 8 },
    input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, padding: 14, fontSize: 16, color: '#111827' },
    textArea: { height: 100, textAlignVertical: 'top' },
    derivedBox: { backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, marginTop: 8, alignItems: 'center' },
    derivedLabel: { fontSize: 13, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', marginBottom: 4 },
    derivedValue: { fontSize: 24, fontWeight: '800', color: '#111827' },
    errorText: { color: '#EF4444' },
    errorSubtext: { fontSize: 12, color: '#EF4444', marginTop: 4, fontWeight: '600' },
    primaryButton: { backgroundColor: '#111827', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
    primaryButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
    buttonDisabled: { opacity: 0.7 },
});
