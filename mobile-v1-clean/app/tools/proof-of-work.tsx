import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform } from 'react-native';
import { fetchWithAuth } from '../../src/config/api';
import { useSteward } from '../../src/context/StewardContext';
import { PageHeader } from '../../src/components/PageHeader';
import { FeatureLockedCard } from '../../src/components/FeatureLockedCard';

export default function ProofOfWorkScreen() {
    const router = useRouter();
    const { profile, canAccess } = useSteward();

    const [customerName, setCustomerName] = useState('');
    const [relatedQuote, setRelatedQuote] = useState('');
    const [workPerformed, setWorkPerformed] = useState('');
    const [completionDate, setCompletionDate] = useState(new Date().toISOString().split('T')[0]);
    const [completionNotes, setCompletionNotes] = useState('');
    const [customerOutcome, setCustomerOutcome] = useState('');
    
    // Note: Image upload will be handled natively in a future iteration, 
    // but the fields are ready for when the storage bucket is wired.
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!customerName.trim() || !workPerformed.trim()) {
            Alert.alert("Missing Fields", "Please enter the Customer Name and Work Performed.");
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
                related_entity_type: "proof_of_work",
                related_entity_id: profile?.id,
                payload_json: {
                    surface: "proof_of_work",
                    capture_type: "Work Completed",
                    title: `Work Completed for ${customerName}`,
                    description: workPerformed,
                    customer_name: customerName,
                    related_quote: relatedQuote,
                    completion_date: completionDate,
                    completion_notes: completionNotes,
                    customer_outcome: customerOutcome,
                    before_images: [],
                    after_images: []
                }
            };

            await fetchWithAuth('/continuity-events/', {
                method: 'POST',
                body: JSON.stringify(payloadBody)
            });

            Alert.alert(
                "Work Preserved",
                "Your Proof of Work has been saved to your Timeline.",
                [
                    {
                        text: "OK",
                        onPress: () => {
                            if (router.canGoBack()) {
                                router.back();
                            } else {
                                router.replace('/tabs/home');
                            }
                        },
                    },
                ]
            );
        } catch (error) {
            console.error("Proof of Work Error:", error);
            Alert.alert("Error", "Failed to preserve work record. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (!canAccess("proof_of_work")) {
        return (
            <ScrollView style={styles.container}>
                <PageHeader 
                    eyebrow="Steward Tools" 
                    title="Proof of Work" 
                    subtitle="Record completed work and customer outcomes." 
                />
                <View style={styles.subcontent}>
                    <FeatureLockedCard 
                        featureName="Proof of Work" 
                        description="Capture and prove your work history to anyone. Build an undeniable timeline of your success."
                        packName="Continuity Pack" 
                    />
                </View>
            </ScrollView>
        );
    }

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
            <PageHeader 
                eyebrow="Steward Tools" 
                title="Proof of Work" 
                subtitle="Record completed work and customer outcomes." 
            />

            <View style={styles.subcontent}>
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Job Details</Text>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Customer Name</Text>
                        <TextInput style={styles.input} value={customerName} onChangeText={setCustomerName} placeholder="e.g. Jane Doe" />
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Related Quote / Job ID (Optional)</Text>
                        <TextInput style={styles.input} value={relatedQuote} onChangeText={setRelatedQuote} placeholder="e.g. IPH-123A" />
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Completion Date</Text>
                        <TextInput style={styles.input} value={completionDate} onChangeText={setCompletionDate} placeholder="YYYY-MM-DD" />
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Work Performed</Text>
                        <TextInput 
                            style={[styles.input, styles.textArea]} 
                            value={workPerformed} 
                            onChangeText={setWorkPerformed} 
                            placeholder="Describe what was actually done..." 
                            multiline 
                            numberOfLines={4} 
                        />
                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Evidence & Outcome</Text>
                    
                    <View style={styles.placeholderBox}>
                        <Text style={styles.placeholderLabel}>📷 Photo Evidence</Text>
                        <Text style={styles.placeholderText}>Before & After photo upload will be active once the media bucket is live.</Text>
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Completion Notes</Text>
                        <TextInput 
                            style={[styles.input, styles.textArea]} 
                            value={completionNotes} 
                            onChangeText={setCompletionNotes} 
                            placeholder="Internal notes, difficulties, or follow-ups required..." 
                            multiline 
                            numberOfLines={3} 
                        />
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Customer Outcome</Text>
                        <TextInput 
                            style={[styles.input, styles.textArea]} 
                            value={customerOutcome} 
                            onChangeText={setCustomerOutcome} 
                            placeholder="e.g. Customer tested the system and signed off." 
                            multiline 
                            numberOfLines={2} 
                        />
                    </View>
                </View>

                <TouchableOpacity 
                    style={[styles.primaryButton, loading && styles.buttonDisabled]} 
                    onPress={handleSave}
                    disabled={loading}
                >
                    <Text style={styles.primaryButtonText}>
                        {loading ? "Preserving..." : "Preserve Record"}
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
    sectionTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 16 },
    fieldGroup: { marginBottom: 16 },
    label: { fontSize: 14, fontWeight: '600', color: '#4B5563', marginBottom: 8 },
    input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, fontSize: 16, color: '#111827' },
    textArea: { height: 100, textAlignVertical: 'top' },
    placeholderBox: { backgroundColor: '#F3F4F6', padding: 16, borderRadius: 8, marginBottom: 16, alignItems: 'center' },
    placeholderLabel: { fontSize: 14, fontWeight: '700', color: '#4B5563', marginBottom: 4 },
    placeholderText: { fontSize: 12, color: '#6B7280', textAlign: 'center' },
    primaryButton: { backgroundColor: '#111827', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
    primaryButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
    buttonDisabled: { opacity: 0.7 }
});
