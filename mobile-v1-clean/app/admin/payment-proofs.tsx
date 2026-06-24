import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView, Alert, Linking, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSteward } from '../../src/state/StewardContext';
import { getPaymentProofs, approvePayment, rejectPayment, PaymentReview } from '../../src/api/adminApi';
import { theme } from '../../config/theme';
import { PageHeader } from '../components/PageHeader';

export default function AdminPaymentProofsScreen() {
    const router = useRouter();
    const { profile, isLoadingProfile } = useSteward();
    const [proofs, setProofs] = useState<PaymentReview[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    
    // Reject Modal State
    const [rejectModalVisible, setRejectModalVisible] = useState(false);
    const [rejectNote, setRejectNote] = useState('');
    const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoadingProfile && profile?.role !== 'admin') {
            Alert.alert('Access Denied', 'You do not have permission to view this page.');
            router.replace('/tabs/home');
            return;
        }

        if (profile?.role === 'admin') {
            loadProofs();
        }
    }, [profile, isLoadingProfile]);

    const loadProofs = async () => {
        setLoading(true);
        try {
            const data = await getPaymentProofs('pending_review');
            setProofs(data);
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to load payment proofs');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (profileId: string) => {
        Alert.alert(
            "Approve Profile",
            "Are you sure you want to approve this setup fee and activate the profile?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Approve", 
                    style: "default",
                    onPress: async () => {
                        setActionLoading(true);
                        try {
                            await approvePayment(profileId);
                            Alert.alert("Success", "Profile has been approved and activated.");
                            await loadProofs();
                        } catch (err: any) {
                            Alert.alert('Error', err.message || 'Failed to approve');
                        } finally {
                            setActionLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const openRejectModal = (profileId: string) => {
        setSelectedProfileId(profileId);
        setRejectNote('');
        setRejectModalVisible(true);
    };

    const handleReject = async () => {
        if (!selectedProfileId) return;
        if (!rejectNote.trim()) {
            Alert.alert("Required", "Please provide a reason for rejection.");
            return;
        }

        setActionLoading(true);
        try {
            await rejectPayment(selectedProfileId, rejectNote.trim());
            Alert.alert("Success", "Profile has been rejected.");
            setRejectModalVisible(false);
            await loadProofs();
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to reject');
        } finally {
            setActionLoading(false);
        }
    };

    if (isLoadingProfile || loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <PageHeader title="Payment Proofs" showBack />
                <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <PageHeader title="Payment Proofs" showBack />
            
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                
                <Text style={styles.sectionTitle}>Pending Reviews ({proofs.length})</Text>

                {proofs.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="checkmark-done-circle-outline" size={48} color="#10B981" />
                        <Text style={styles.emptyText}>All caught up!</Text>
                        <Text style={styles.emptySubtext}>No pending payment proofs to review.</Text>
                    </View>
                ) : (
                    proofs.map(proof => (
                        <View key={proof.profile_id} style={styles.card}>
                            <View style={styles.cardHeader}>
                                <View style={styles.cardHeaderLeft}>
                                    <Text style={styles.profileName}>{proof.name}</Text>
                                    <Text style={styles.profileEmail}>{proof.email}</Text>
                                    {proof.business_name && (
                                        <Text style={styles.businessName}>Business: {proof.business_name}</Text>
                                    )}
                                </View>
                            </View>

                            <View style={styles.proofSection}>
                                {proof.setup_fee_proof_url ? (
                                    <TouchableOpacity 
                                        style={styles.viewProofBtn}
                                        onPress={() => Linking.openURL(proof.setup_fee_proof_url!)}
                                    >
                                        <Ionicons name="image-outline" size={20} color={theme.colors.navy} />
                                        <Text style={styles.viewProofText}>View Uploaded Proof</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <Text style={styles.noProofText}>No file uploaded.</Text>
                                )}
                            </View>

                            <View style={styles.actionsRow}>
                                <TouchableOpacity 
                                    style={[styles.actionBtn, styles.rejectBtn]}
                                    onPress={() => openRejectModal(proof.profile_id)}
                                    disabled={actionLoading}
                                >
                                    <Ionicons name="close-circle-outline" size={18} color="#EF4444" />
                                    <Text style={styles.rejectBtnText}>Reject</Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity 
                                    style={[styles.actionBtn, styles.approveBtn]}
                                    onPress={() => handleApprove(proof.profile_id)}
                                    disabled={actionLoading}
                                >
                                    <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                                    <Text style={styles.approveBtnText}>Approve</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>

            <Modal visible={rejectModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Reject Payment Proof</Text>
                        <Text style={styles.modalSub}>Please provide a reason. This will be shown to the steward.</Text>
                        
                        <TextInput
                            style={styles.modalInput}
                            placeholder="e.g. Image is blurry, please re-upload."
                            value={rejectNote}
                            onChangeText={setRejectNote}
                            multiline
                            numberOfLines={3}
                            autoFocus
                        />
                        
                        <View style={styles.modalActions}>
                            <TouchableOpacity 
                                style={[styles.modalBtn, styles.modalCancelBtn]} 
                                onPress={() => setRejectModalVisible(false)}
                            >
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalBtn, styles.modalRejectSubmitBtn]} 
                                onPress={handleReject}
                                disabled={actionLoading}
                            >
                                <Text style={styles.modalRejectText}>{actionLoading ? "Rejecting..." : "Reject Profile"}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
    container: { flex: 1 },
    content: { padding: 24, paddingBottom: 60 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 },
    
    emptyState: { alignItems: 'center', marginTop: 40, padding: 24, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB' },
    emptyText: { fontSize: 18, fontWeight: '700', color: '#111827', marginTop: 16 },
    emptySubtext: { fontSize: 14, color: '#6B7280', marginTop: 8, textAlign: 'center' },

    card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    cardHeaderLeft: { flex: 1 },
    profileName: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 4 },
    profileEmail: { fontSize: 14, color: '#6B7280', marginBottom: 4 },
    businessName: { fontSize: 14, fontWeight: '500', color: theme.colors.navy },
    
    proofSection: { backgroundColor: '#F3F4F6', borderRadius: 8, padding: 16, marginBottom: 16, alignItems: 'center' },
    viewProofBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB' },
    viewProofText: { fontSize: 14, fontWeight: '600', color: theme.colors.navy },
    noProofText: { fontSize: 14, color: '#9CA3AF', fontStyle: 'italic' },

    actionsRow: { flexDirection: 'row', gap: 12 },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 8, gap: 6 },
    rejectBtn: { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FCA5A5' },
    rejectBtnText: { color: '#EF4444', fontWeight: '600', fontSize: 14 },
    approveBtn: { backgroundColor: '#10B981' },
    approveBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
    modalTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8 },
    modalSub: { fontSize: 14, color: '#6B7280', marginBottom: 20 },
    modalInput: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 16, fontSize: 16, minHeight: 100, textAlignVertical: 'top', marginBottom: 24 },
    modalActions: { flexDirection: 'row', gap: 12 },
    modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    modalCancelBtn: { backgroundColor: '#F3F4F6' },
    modalCancelText: { color: '#4B5563', fontWeight: '600', fontSize: 16 },
    modalRejectSubmitBtn: { backgroundColor: '#EF4444' },
    modalRejectText: { color: '#FFFFFF', fontWeight: '600', fontSize: 16 },
});
