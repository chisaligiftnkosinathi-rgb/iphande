import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useSteward } from '../../context/StewardContext';
import { createQuoteRequest } from '../../services/apiClient';

const REQUEST_TYPES = ['new_application', 'quotation', 'reinstatement', 'cover_increase', 'addition'];
const PLAN_INTERESTS = ['family', 'pensioner', 'extended_family', 'unsure'];

export default function LeadQuoteCaptureScreen() {
    const params = useLocalSearchParams<{ postId?: string }>();
    const sourcePostId = params.postId || '';
    const { stewardId, steward } = useSteward() as any;

    const [customerName, setCustomerName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [requestType, setRequestType] = useState(REQUEST_TYPES[0]);
    const [planInterest, setPlanInterest] = useState(PLAN_INTERESTS[0]);
    const [notes, setNotes] = useState('');
    const [editablePostId, setEditablePostId] = useState(sourcePostId);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!stewardId) {
            Alert.alert('Error', 'Steward identity not ready. Please sign in and complete your profile.');
            return;
        }

        if (!customerName || !phoneNumber) {
            Alert.alert('Validation', 'Name and phone number are required.');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                business_owner_id: stewardId,
                business_category_key: steward?.business_category_key || 'general_business',
                business_line: steward?.business_line || 'Services',
                post_id: editablePostId || undefined,
                customer_name: customerName,
                customer_phone: phoneNumber,
                service_needed: requestType,
                message: `Plan Interest: ${planInterest}\nNotes: ${notes}`,
            };

            await createQuoteRequest(payload);
            Alert.alert('Success', 'Lead captured and recorded to the operational graph.');
            router.back();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to capture lead.');
        } finally {
            setLoading(false);
        }
    };

    const renderPill = (options: string[], selected: string, onSelect: (val: string) => void) => (
        <View style={styles.pillContainer}>
            {options.map((opt) => (
                <TouchableOpacity
                    key={opt}
                    style={[styles.pill, selected === opt && styles.pillSelected]}
                    onPress={() => onSelect(opt)}
                >
                    <Text style={[styles.pillText, selected === opt && styles.pillTextSelected]}>
                        {opt.replace('_', ' ').toUpperCase()}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    return (
        <View style={{ flex: 1 }}>
            <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
                <View style={styles.headerCard}>
                    <Text style={styles.owner}>Steward: {stewardId}</Text>
                </View>

                <View style={styles.formCard}>
                    <Text style={styles.label}>Customer Name</Text>
                    <TextInput style={styles.input} value={customerName} onChangeText={setCustomerName} placeholder="Enter customer name" />

                    <Text style={styles.label}>Phone Number (WhatsApp)</Text>
                    <TextInput style={styles.input} value={phoneNumber} onChangeText={setPhoneNumber} placeholder="Enter phone number" keyboardType="phone-pad" />

                    <Text style={styles.label}>Request Type</Text>
                    {renderPill(REQUEST_TYPES, requestType, setRequestType)}

                    <Text style={styles.label}>Plan Interest</Text>
                    {renderPill(PLAN_INTERESTS, planInterest, setPlanInterest)}

                    <Text style={styles.label}>Source Content Post ID (Optional)</Text>
                    <TextInput style={styles.input} value={editablePostId} onChangeText={setEditablePostId} placeholder="e.g. CPT-1024" />

                    <Text style={styles.label}>Operational Notes</Text>
                    <TextInput style={[styles.input, styles.textArea]} value={notes} onChangeText={setNotes} placeholder="Add background notes here..." multiline numberOfLines={3} />
                </View>

                <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Capture Lead</Text>}
                </TouchableOpacity>

                <View style={styles.boundaryBox}>
                    <Text style={styles.boundaryText}>
                        Lead capture is not sale confirmation. Quote request is not policy approval. Commission is not earned until downstream evidence exists. Commission is only recorded after verified sale evidence.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#F8FAF7' },
    content: { padding: 20, gap: 16 },
    headerCard: { backgroundColor: '#FFFFFF', borderRadius: 8, padding: 18, borderWidth: 1, borderColor: '#E5E7EB' },
    eyebrow: { fontSize: 12, fontWeight: '900', color: '#2F6B4F', textTransform: 'uppercase', marginBottom: 6 },
    header: { fontSize: 28, fontWeight: '900', color: '#102A20', marginBottom: 8 },
    owner: { fontSize: 12, fontWeight: '800', color: '#6B7280' },
    formCard: { backgroundColor: '#FFFFFF', borderRadius: 8, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' },
    label: { fontSize: 13, fontWeight: '800', color: '#374151', marginBottom: 6, marginTop: 12 },
    input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 6, padding: 10, fontSize: 14, backgroundColor: '#F9FAFB', color: '#111827' },
    textArea: { minHeight: 80, textAlignVertical: 'top' },
    pillContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
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
    submitButton: { backgroundColor: '#1E3A2F', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    submitText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
    boundaryBox: { marginTop: 10, padding: 14, backgroundColor: '#FEF2F2', borderRadius: 8, borderWidth: 1, borderColor: '#FCA5A5' },
    boundaryText: { color: '#991B1B', fontSize: 12, fontWeight: '800', textAlign: 'center', lineHeight: 18 },
});
