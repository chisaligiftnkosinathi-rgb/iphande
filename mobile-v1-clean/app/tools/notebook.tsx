import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { fetchWithAuth } from '../../src/config/api';
import { useSteward } from '../../src/context/StewardContext';

export enum EventType {
    Observation = "Observation",
    Lead = "Lead",
    Invoice = "Invoice",
    WorkStarted = "Work Started",
    WorkCompleted = "Work Completed",
    Quote = "Quote",
    FollowUp = "Follow-up",
    Reflection = "Reflection"
}

const EVENT_TYPES = Object.values(EventType);

export default function NotebookScreen() {
    const router = useRouter();
    const { profile } = useSteward();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [eventType, setEventType] = useState<EventType>(EventType.Observation);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!title.trim() || !description.trim()) {
            Alert.alert("Missing information", "Add a title and description before saving.");
            return;
        }

        if (!profile?.id) {
            Alert.alert("Steward profile not ready", "Please wait for your steward profile to load.");
            return;
        }

        setLoading(true);

        try {
            console.log("SAVE BUTTON PRESSED");

            const payloadBody = {
                business_owner_id: profile?.id,
                business_category_key: profile?.business_category_key,
                business_line: profile?.business_line,
                event_type: "entity_created",
                actor_type: "business_owner",
                actor_id: profile?.id,
                related_entity_type: "continuity_capture",
                related_entity_id: profile?.id,
                payload_json: {
                    surface: "continuity_ledger",
                    capture_type: eventType,
                    title,
                    description,
                }
            };

            console.log("CONTINUITY PAYLOAD", payloadBody);

            // We push this directly into the continuity events ledger to feed the timeline
            await fetchWithAuth('/continuity-events/', {
                method: 'POST',
                body: JSON.stringify(payloadBody)
            });

            console.log("FETCH COMPLETED");
            console.log("SAVE SUCCESS");

            Alert.alert(
                "Record saved",
                "This record has been saved to your Timeline.",
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
            console.error("Capture Error:", error);
            Alert.alert("Error", "Failed to save this record. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <Text style={styles.title}>Continuity Ledger</Text>
                <Text style={styles.subtitle}>Record what happened before it gets lost.</Text>
            </View>

            <Text style={styles.label}>What are you recording?</Text>

            <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setIsDropdownOpen(!isDropdownOpen)}
            >
                <Text style={styles.dropdownButtonText}>{eventType}</Text>
                <Text style={styles.dropdownIcon}>{isDropdownOpen ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {isDropdownOpen && (
                <View style={styles.dropdownList}>
                    {EVENT_TYPES.map((type) => (
                        <TouchableOpacity
                            key={type}
                            style={[styles.dropdownItem, eventType === type && styles.dropdownItemActive]}
                            onPress={() => {
                                setEventType(type as EventType);
                                setIsDropdownOpen(false);
                            }}
                        >
                            <Text style={[styles.dropdownItemText, eventType === type && styles.dropdownItemTextActive]}>
                                {type}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            <Text style={styles.label}>Title</Text>
            <TextInput
                style={styles.input}
                placeholder="e.g. Roof inspection at Klarinet"
                placeholderTextColor="#9CA3AF"
                value={title}
                onChangeText={setTitle}
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="What happened? What needs to be remembered?"
                placeholderTextColor="#9CA3AF"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
            />

            <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={handleSave}
                disabled={loading}
            >
                <Text style={styles.primaryButtonText}>
                    {loading ? "Saving record..." : "Save Record"}
                </Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    content: { padding: 24, paddingBottom: 48 },
    header: { marginBottom: 24 },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 8
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280'
    },
    label: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 8, marginTop: 16 },
    input: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        padding: 16,
        fontSize: 16,
        color: '#111827',
    },
    textArea: { height: 120 },
    dropdownButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
    },
    dropdownButtonText: { fontSize: 16, color: '#111827' },
    dropdownIcon: { fontSize: 12, color: '#6B7280' },
    dropdownList: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        marginBottom: 16,
        marginTop: -8,
        overflow: 'hidden',
    },
    dropdownItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    dropdownItemActive: { backgroundColor: '#F9FAFB' },
    dropdownItemText: { fontSize: 16, color: '#374151' },
    dropdownItemTextActive: { color: '#111827', fontWeight: '700' },
    primaryButton: { padding: 16, borderRadius: 12, backgroundColor: '#111827', alignItems: 'center', marginTop: 32 },
    primaryButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
    buttonDisabled: { opacity: 0.7 },
});
