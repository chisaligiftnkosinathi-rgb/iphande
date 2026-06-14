import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { AppHeader } from '../components/ui/AppHeader';
import { useAuth } from '../src/auth/AuthContext';
import { buildApiUrl } from '../src/config/api';

const OPPORTUNITY_TYPES = [
    'Business Lead',
    'Service Request',
    'Community Need',
    'Follow-up',
    'Referral',
    'Quote Request',
    'Work Evidence',
    'Support Opportunity',
];

const OPPORTUNITY_STATUSES = [
    'Observed',
    'Contacted',
    'In Progress',
    'Waiting',
    'Completed',
    'Lost',
    'Archived',
];

export const CreateOpportunityScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { stewardId } = useAuth() as any;

    const [type, setType] = useState(OPPORTUNITY_TYPES[0]);
    const [title, setTitle] = useState('');
    const [person, setPerson] = useState('');
    const [contact, setContact] = useState('');
    const [need, setNeed] = useState('');
    const [nextAction, setNextAction] = useState('');
    const [status, setStatus] = useState(OPPORTUNITY_STATUSES[0]);
    const [loading, setLoading] = useState(false);

    const renderPill = (options: string[], selected: string, onSelect: (val: string) => void) => (
        <View style={styles.pillContainer}>
            {options.map((opt) => (
                <Pressable
                    key={opt}
                    style={[styles.pill, selected === opt && styles.pillSelected]}
                    onPress={() => onSelect(opt)}
                >
                    <Text style={[styles.pillText, selected === opt && styles.pillTextSelected]}>
                        {opt}
                    </Text>
                </Pressable>
            ))}
        </View>
    );

    const handleSave = async () => {
        if (!title.trim()) {
            Alert.alert('Validation', 'Title / Summary is required.');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                profile_id: stewardId,
                opportunity_type: type,
                title: title.trim(),
                person_or_business: person.trim() || undefined,
                contact_details: contact.trim() || undefined,
                need_or_request: need.trim() || undefined,
                next_action: nextAction.trim() || undefined,
                status: status,
            };

            const response = await fetch(buildApiUrl('/opportunities'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error('Failed to save opportunity');

            navigation.goBack();
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Unable to save opportunity at this time.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: '#F8FAF7' }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <AppHeader title="Capture Opportunity" />
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <View style={styles.card}>
                    <Text style={styles.description}>
                        Record a lead, need, request, or follow-up.
                    </Text>

                    <Text style={styles.label}>Opportunity Type *</Text>
                    {renderPill(OPPORTUNITY_TYPES, type, setType)}

                    <Text style={styles.label}>Title / Summary *</Text>
                    <TextInput
                        style={styles.input}
                        value={title}
                        onChangeText={setTitle}
                        placeholder="e.g. Website for Grace Church"
                        placeholderTextColor="#9CA3AF"
                    />

                    <Text style={styles.label}>Person / Business / Community</Text>
                    <TextInput
                        style={styles.input}
                        value={person}
                        onChangeText={setPerson}
                        placeholder="Who is this for?"
                        placeholderTextColor="#9CA3AF"
                    />

                    <Text style={styles.label}>Contact Details</Text>
                    <TextInput
                        style={styles.input}
                        value={contact}
                        onChangeText={setContact}
                        placeholder="Phone or email"
                        placeholderTextColor="#9CA3AF"
                    />

                    <Text style={styles.label}>Need or Request</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={need}
                        onChangeText={setNeed}
                        placeholder="What do they need?"
                        placeholderTextColor="#9CA3AF"
                        multiline
                    />

                    <Text style={styles.label}>Next Action</Text>
                    <TextInput
                        style={styles.input}
                        value={nextAction}
                        onChangeText={setNextAction}
                        placeholder="e.g. Call on Friday to confirm"
                        placeholderTextColor="#9CA3AF"
                    />

                    <Text style={styles.label}>Continuity Status *</Text>
                    {renderPill(OPPORTUNITY_STATUSES, status, setStatus)}

                    <Text style={styles.boundaryText}>
                        Saving will preserve this opportunity as continuity evidence.
                    </Text>

                    <Pressable
                        style={[styles.button, loading && { opacity: 0.6 }]}
                        disabled={loading}
                        onPress={handleSave}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={styles.buttonText}>Save Opportunity</Text>
                        )}
                    </Pressable>

                    <View style={styles.continuityPreviewBox}>
                        <Text style={styles.continuityPreviewTitle}>Continuity Event</Text>
                        <Text style={styles.continuityPreviewText}>Opportunity Captured</Text>
                        <Text style={styles.continuityPreviewArrow}>↓</Text>
                        <Text style={styles.continuityPreviewText}>Evidence Preserved</Text>
                        <Text style={styles.continuityPreviewArrow}>↓</Text>
                        <Text style={styles.continuityPreviewText}>Timeline Updated</Text>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    content: { padding: 20, paddingBottom: 40 },
    card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#E5E7EB' },
    description: { fontSize: 14, color: '#4B5563', marginBottom: 20, lineHeight: 20 },
    label: { fontSize: 13, fontWeight: '800', color: '#374151', marginBottom: 8, marginTop: 12 },
    input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111827' },
    textArea: { minHeight: 80, textAlignVertical: 'top' },
    pillContainer: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
    pill: { backgroundColor: '#F9FAFB', borderRadius: 16, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#D1D5DB', margin: 4 },
    pillSelected: { backgroundColor: '#1E3A2F', borderColor: '#1E3A2F' },
    pillText: { fontSize: 12, fontWeight: '700', color: '#4B5563' },
    pillTextSelected: { color: '#FFFFFF' },
    button: {
        backgroundColor: '#1E3A2F',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 12,
    },
    buttonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
    boundaryText: {
        marginTop: 18,
        fontSize: 12,
        color: '#6B7280',
        fontStyle: 'italic',
        textAlign: 'center',
    },
    continuityPreviewBox: {
        marginTop: 24,
        padding: 16,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
    },
    continuityPreviewTitle: {
        fontSize: 11,
        fontWeight: '900',
        color: '#6B7280',
        textTransform: 'uppercase',
        marginBottom: 12,
        letterSpacing: 1,
    },
    continuityPreviewText: { fontSize: 13, fontWeight: '800', color: '#1E3A2F' },
    continuityPreviewArrow: { fontSize: 16, fontWeight: '900', color: '#9CA3AF', marginVertical: 4 },
});
