import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { useSteward } from '../../src/context/StewardContext';
import { uploadPaymentProof } from '../../src/services/paymentProofUploadService';
import { updateMe } from '../../src/services/stewardApi';

export default function ActivationScreen() {
    const { user } = useAuth();
    const { profile, refreshProfile } = useSteward();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [slipImage, setSlipImage] = useState<{ uri: string; fileName: string } | null>(null);

    const isPendingReview = profile?.setup_fee_status === 'pending_review';
    const isRejected = profile?.setup_fee_status === 'rejected';

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
            setSlipImage({ uri, fileName });
        }
    };

    const handleSubmitProof = async () => {
        if (!slipImage) {
            Alert.alert("Missing Proof", "Please tap to select a proof of payment document first.");
            return;
        }
        if (!user) return;

        setIsSubmitting(true);
        try {
            const proofUrl = await uploadPaymentProof(user.id, slipImage.uri, slipImage.fileName);

            await updateMe({
                setup_fee_status: 'pending_review',
                setup_fee_proof_url: proofUrl
            });
            await refreshProfile();
        } catch (error) {
            Alert.alert("Upload Failed", "There was an issue securely saving your proof. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderPendingReview = () => (
        <View style={styles.card}>
            <Text style={styles.cardTitle}>Under Verification</Text>
            <Text style={styles.cardText}>
                Your proof of payment has been submitted and is currently being verified.
            </Text>
            <Text style={[styles.cardText, { marginTop: 12, color: '#6B7280', fontStyle: 'italic' }]}>
                This typically takes a few hours. Please check back later or refresh your status.
            </Text>
            <TouchableOpacity style={styles.secondaryButton} onPress={refreshProfile}>
                <Text style={styles.secondaryButtonText}>Refresh Status</Text>
            </TouchableOpacity>
        </View>
    );

    const renderForm = () => (
        <>
            {isRejected && (
                <View style={styles.alertBox}>
                    <Text style={styles.alertText}>Your previous proof was rejected. Please upload a clear bank slip.</Text>
                </View>
            )}

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Bank Account Details</Text>
                <View style={styles.bankRow}>
                    <Text style={styles.bankLabel}>Account Holder:</Text>
                    <Text style={styles.bankValue}>Global IT and Business Solutions (Pty) Ltd</Text>
                </View>
                <View style={styles.bankRow}>
                    <Text style={styles.bankLabel}>Bank:</Text>
                    <Text style={styles.bankValue}>FNB</Text>
                </View>
                <View style={styles.bankRow}>
                    <Text style={styles.bankLabel}>Account Number:</Text>
                    <Text style={styles.bankValue}>63172952260</Text>
                </View>
                <View style={styles.bankRow}>
                    <Text style={styles.bankLabel}>Branch Code:</Text>
                    <Text style={styles.bankValue}>270151</Text>
                </View>
                <View style={styles.referenceBox}>
                    <Text style={styles.bankLabel}>Reference:</Text>
                    <Text style={styles.referenceValue}>{user?.id.substring(0, 8) || 'Your phone number'}</Text>
                </View>
            </View>

            <View style={styles.uploadSection}>
                <Text style={styles.sectionHeading}>Upload Proof of Payment</Text>
                <TouchableOpacity
                    style={[styles.uploadBox, slipImage && styles.uploadBoxActive]}
                    onPress={pickImage}
                >
                    <Text style={[styles.uploadText, slipImage && styles.uploadTextActive]}>
                        {slipImage ? `📄 ${slipImage.fileName} (Tap to change)` : "Tap to browse files"}
                    </Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                style={[styles.primaryButton, isSubmitting && styles.buttonDisabled]}
                onPress={handleSubmitProof}
                disabled={isSubmitting}
            >
                <Text style={styles.primaryButtonText}>
                    {isSubmitting ? "Submitting..." : "Submit Proof for Verification"}
                </Text>
            </TouchableOpacity>
        </>
    );

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <Text style={styles.kicker}>Step 2</Text>
                <Text style={styles.title}>Activate Profile</Text>
                <Text style={styles.subtitle}>A once-off R120 fee is required to become a verified Steward.</Text>
            </View>

            {isPendingReview ? renderPendingReview() : renderForm()}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    content: { padding: 24, paddingBottom: 48 },
    header: { marginBottom: 32, marginTop: 24 },
    kicker: { fontSize: 14, fontWeight: '700', color: '#6B7280', marginBottom: 4 },
    title: { fontSize: 28, fontWeight: '800', color: '#111827', marginBottom: 8 },
    subtitle: { fontSize: 18, color: '#6B7280' },
    card: {
        padding: 24,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        marginBottom: 32,
        backgroundColor: '#FFFFFF',
    },
    cardTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 16 },
    cardText: { fontSize: 15, color: '#4B5563', lineHeight: 22 },
    bankRow: { marginBottom: 12 },
    bankLabel: { fontSize: 13, color: '#6B7280', fontWeight: '600', textTransform: 'uppercase' },
    bankValue: { fontSize: 16, color: '#111827', fontWeight: '500', marginTop: 2 },
    referenceBox: { backgroundColor: '#F3F4F6', padding: 12, borderRadius: 8, marginTop: 12 },
    referenceValue: { fontSize: 18, color: '#111827', fontWeight: '800', marginTop: 2, letterSpacing: 1 },
    uploadSection: { marginBottom: 32 },
    sectionHeading: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
    uploadBox: {
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
        borderRadius: 12,
        padding: 32,
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    uploadBoxActive: { borderColor: '#10B981', backgroundColor: '#ECFDF5', borderStyle: 'solid' },
    uploadText: { color: '#6B7280', fontWeight: '600', fontSize: 15 },
    uploadTextActive: { color: '#065F46' },
    alertBox: { backgroundColor: '#FEF2F2', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#FCA5A5', marginBottom: 24 },
    alertText: { color: '#DC2626', fontWeight: '600', fontSize: 14, textAlign: 'center' },
    primaryButton: {
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#111827',
        alignItems: 'center',
    },
    primaryButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
    secondaryButton: {
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        alignItems: 'center',
        marginTop: 24,
    },
    secondaryButtonText: { color: '#111827', fontWeight: '700', fontSize: 16 },
    buttonDisabled: { opacity: 0.7 },
    bold: { fontWeight: '700', color: '#111827' },
});
