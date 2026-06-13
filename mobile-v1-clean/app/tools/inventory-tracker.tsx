import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform } from 'react-native';
import { fetchWithAuth } from '../../src/config/api';
import { useSteward } from '../../src/context/StewardContext';
import { PageHeader } from '../../src/components/PageHeader';

export default function InventoryTrackerScreen() {
    const router = useRouter();
    const { profile } = useSteward();
    const [loading, setLoading] = useState(false);

    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [itemName, setItemName] = useState('');
    const [category, setCategory] = useState('');
    const [quantity, setQuantity] = useState('');
    const [unit, setUnit] = useState('pcs');
    const [unitCost, setUnitCost] = useState('');
    const [customerJob, setCustomerJob] = useState('');
    const [notes, setNotes] = useState('');

    const qty = parseFloat(quantity);
    const cost = parseFloat(unitCost);
    const totalCost = (!isNaN(qty) && !isNaN(cost)) ? qty * cost : 0;

    const handleSave = async () => {
        if (!itemName || !quantity || !unitCost) {
            Alert.alert("Missing Fields", "Please enter Item Name, Quantity, and Unit Cost.");
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
                related_entity_type: "inventory_entry",
                related_entity_id: profile?.id,
                payload_json: {
                    surface: "inventory_tracker",
                    capture_type: "Inventory Log",
                    title: `Inventory: ${qty} ${unit} of ${itemName}`,
                    description: category || 'General Material',
                    date: date,
                    item_name: itemName,
                    category: category,
                    quantity: qty,
                    unit: unit,
                    unit_cost: cost,
                    total_cost: totalCost,
                    customer_job: customerJob,
                    notes: notes
                }
            };

            await fetchWithAuth('/continuity-events/', {
                method: 'POST',
                body: JSON.stringify(payloadBody)
            });

            Alert.alert(
                "Record saved", 
                "Your inventory log has been preserved to the Continuity Ledger.",
                [{ text: "OK", onPress: () => router.back() }]
            );
        } catch (error) {
            console.error("Inventory Tracker Error:", error);
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
                title="Inventory Tracker" 
                subtitle="Record materials, stock, and costs securely." 
            />

            <View style={styles.subcontent}>
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Item Details</Text>
                    <Text style={styles.formulaHelper}>Formula: Quantity × Unit Cost</Text>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Date</Text>
                        <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Item Name</Text>
                        <TextInput style={styles.input} value={itemName} onChangeText={setItemName} placeholder="e.g. Copper Wire" />
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Category</Text>
                        <TextInput style={styles.input} value={category} onChangeText={setCategory} placeholder="e.g. Electrical Materials" />
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Related Customer / Job</Text>
                        <TextInput style={styles.input} value={customerJob} onChangeText={setCustomerJob} placeholder="e.g. Job #IPH-123" />
                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Cost & Quantity</Text>
                    
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <View style={[styles.fieldGroup, { flex: 1 }]}>
                            <Text style={styles.label}>Quantity</Text>
                            <TextInput 
                                style={styles.input} 
                                value={quantity} 
                                onChangeText={setQuantity} 
                                placeholder="0" 
                                keyboardType="numeric" 
                            />
                        </View>
                        <View style={[styles.fieldGroup, { flex: 1 }]}>
                            <Text style={styles.label}>Unit</Text>
                            <TextInput 
                                style={styles.input} 
                                value={unit} 
                                onChangeText={setUnit} 
                                placeholder="pcs" 
                            />
                        </View>
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Unit Cost (ZAR)</Text>
                        <TextInput 
                            style={styles.input} 
                            value={unitCost} 
                            onChangeText={setUnitCost} 
                            placeholder="0.00" 
                            keyboardType="numeric" 
                        />
                    </View>

                    <View style={styles.derivedBox}>
                        <Text style={styles.derivedLabel}>Total Cost</Text>
                        <Text style={styles.derivedValue}>
                            {(!isNaN(qty) && !isNaN(cost)) ? `R ${totalCost.toFixed(2)}` : "—"}
                        </Text>
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
                            placeholder="Add supplier info, serial numbers, or context..." 
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
    subcontent: { padding: 24, paddingBottom: 60 },
    card: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 24 },
    formulaHelper: { fontSize: 13, color: '#6B7280', marginBottom: 16, fontStyle: 'italic' },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 16 },
    fieldGroup: { marginBottom: 16 },
    label: { fontSize: 14, fontWeight: '600', color: '#4B5563', marginBottom: 8 },
    input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, fontSize: 16, color: '#111827' },
    textArea: { height: 100, textAlignVertical: 'top' },
    derivedBox: { backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, marginTop: 8, alignItems: 'center' },
    derivedLabel: { fontSize: 13, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', marginBottom: 4 },
    derivedValue: { fontSize: 24, fontWeight: '800', color: '#10B981' }, // Green for money
    primaryButton: { backgroundColor: '#111827', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
    primaryButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
    buttonDisabled: { opacity: 0.7 },
});
