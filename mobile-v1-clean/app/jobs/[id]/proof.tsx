import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../../src/state/AuthContext';
import { uploadWorkProof } from '../../../src/api/workProofUploadService';
import { fetchWithAuth } from '../../../config/api';

export default function ProofOfWorkScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { user } = useAuth();

    const [proofImage, setProofImage] = useState<{ uri: string; fileName: string } | null>(null);
    const [note, setNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Mock job details context (in real life, fetched via the ID)
    const jobTitle = "Outside tap installation";
    const customerName = "Sipho Ndlovu";

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            const uri = asset.uri;
            const fileName = asset.fileName || uri.split('/').pop() || 'proof.jpg';
            setProofImage({ uri, fileName });
        }
    };

    const handleSubmitProof = async () => {
        if (!proofImage) {
            Alert.alert("Missing Evidence", "Please capture or select a photo of the completed work.");
            return;
        }
        if (!user) return;

        setIsSubmitting(true);
        try {
            const proofUrl = await uploadWorkProof(user.id, id as string, proofImage.uri, proofImage.fileName);

            // Record the continuity event via API
            await fetchWithAuth('/continuity', {
                method: 'POST',
                body: JSON.stringify({
                    business_owner_id: user.id,
                    event_type: 'job_completed',
                    actor_type: 'STEWARD',
                    actor_id: user.id,
                    related_entity_type: 'opportunity',
                    related_entity_id: id,
                    payload_json: {
                        proof_url: proofUrl,
                        note: note
                    }
                })
            });

            Alert.alert("Job Completed", "Proof of work uploaded to the continuity ledger.", [
                { text: "Finish", onPress: () => router.push('/tabs/timeline') }
            ]);
        } catch (error) {
            Alert.alert("Upload Failed", "There was an issue saving your proof of work. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.kicker}>Job {id}</Text>
                <Text style={styles.title}>Proof of Work</Text>
                <Text style={styles.subtitle}>Upload evidence to close this job.</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.card}>
                    <Text style={styles.sectionHeading}>Job Details</Text>
                    <Text style={styles.primaryText}>{jobTitle}</Text>
                    <Text style={styles.secondaryText}>Customer: {customerName}</Text>
                </View>

                <View style={styles.uploadSection}>
                    <Text style={styles.sectionHeading}>Capture Photo</Text>
                    <TouchableOpacity
                        style={[styles.uploadBox, proofImage && styles.uploadBoxActive]}
                        onPress={pickImage}
                    >
                        <Text style={[styles.uploadText, proofImage && styles.uploadTextActive]}>
                            {proofImage ? `📷 ${proofImage.fileName} (Tap to change)` : "Tap to browse photos"}
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.noteSection}>
                    <Text style={styles.sectionHeading}>Short Note (Optional)</Text>
                    <TextInput
                        style={styles.inputTextArea}
                        placeholder="Any final observations or notes on the job..."
                        multiline
                        placeholderTextColor="#9CA3AF"
                        value={note}
                        onChangeText={setNote}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.primaryButton, isSubmitting && styles.buttonDisabled]}
                    onPress={handleSubmitProof}
                    disabled={isSubmitting}
                >
                    <Text style={styles.primaryButtonText}>
                        {isSubmitting ? "Uploading Proof..." : "Submit Proof"}
                    </Text>
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
    content: { padding: 24 },
    card: {
        backgroundColor: '#FFFFFF', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 24,
    },
    sectionHeading: { fontSize: 13, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 },
    primaryText: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 4 },
    secondaryText: { fontSize: 15, color: '#4B5563' },
    uploadSection: { marginBottom: 24 },
    uploadBox: {
        borderWidth: 2, borderColor: '#E5E7EB', borderStyle: 'dashed', borderRadius: 12, padding: 32, alignItems: 'center', backgroundColor: '#FFFFFF',
    },
    uploadBoxActive: { borderColor: '#10B981', backgroundColor: '#ECFDF5', borderStyle: 'solid' },
    uploadText: { color: '#6B7280', fontWeight: '600', fontSize: 15 },
    uploadTextActive: { color: '#065F46' },
    noteSection: { marginBottom: 32 },
    inputTextArea: {
        backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 16, fontSize: 16, color: '#111827', minHeight: 100, textAlignVertical: 'top'
    },
    primaryButton: {
        backgroundColor: '#111827', paddingVertical: 16, borderRadius: 12, alignItems: 'center',
    },
    primaryButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
    buttonDisabled: { opacity: 0.7 },
});

