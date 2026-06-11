import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { fetchWithAuth } from '../../src/config/api';

interface PendingProfile {
    id: string;
    name: string;
    email: string;
    setup_fee_status: string;
    setup_fee_proof_url: string | null;
}

export default function AdminPaymentsReviewScreen() {
    const [profiles, setProfiles] = useState<PendingProfile[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchPendingProfiles();
    }, []);

    const fetchPendingProfiles = async () => {
        setLoading(true);
        try {
            // Use fetchWithAuth so it attaches your token
            const data = await fetchWithAuth('/profiles?setup_fee_status=pending_review');
            setProfiles(data || []);
        } catch (error) {
            console.error("Fetch pending profiles error:", error);
            Alert.alert('Error', 'Failed to fetch pending profiles.');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (profileId: string) => {
        try {
            await fetchWithAuth(`/profiles/${profileId}/setup-fee`, {
                method: 'PATCH',
                body: JSON.stringify({
                    setup_fee_status: 'approved',
                    setup_fee_review_note: 'Approved manually via admin dashboard'
                })
            });
            Alert.alert('Success', 'Profile activated successfully.');
            fetchPendingProfiles();
        } catch (error) {
            console.error("Approve error:", error);
            Alert.alert('Error', 'Failed to approve profile.');
        }
    };

    const handleReject = async (profileId: string) => {
        try {
            await fetchWithAuth(`/profiles/${profileId}/setup-fee`, {
                method: 'PATCH',
                body: JSON.stringify({
                    setup_fee_status: 'rejected',
                    setup_fee_review_note: 'Proof of payment rejected or invalid'
                })
            });
            Alert.alert('Rejected', 'Profile activation rejected.');
            fetchPendingProfiles();
        } catch (error) {
            console.error("Reject error:", error);
            Alert.alert('Error', 'Failed to reject profile.');
        }
    };

    const openProof = (url: string | null) => {
        if (url) {
            Linking.openURL(url);
        } else {
            Alert.alert('No Proof', 'No proof URL provided for this profile.');
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Admin Control</Text>
                <Text style={styles.subtitle}>Review pending setup fee payments</Text>
            </View>

            <View style={styles.listContainer}>
                {loading ? (
                    <ActivityIndicator size="large" color="#111827" style={{ marginTop: 40 }} />
                ) : profiles.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>No pending profiles to review right now.</Text>
                        <TouchableOpacity onPress={fetchPendingProfiles} style={{ marginTop: 12 }}>
                            <Text style={{ color: '#2563EB', fontWeight: '600' }}>Refresh</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    profiles.map((p) => (
                        <View key={p.id} style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardTitle}>{p.name}</Text>
                                <Text style={styles.cardEmail}>{p.email}</Text>
                            </View>

                            <TouchableOpacity style={styles.proofBtn} onPress={() => openProof(p.setup_fee_proof_url)}>
                                <Text style={styles.proofBtnText}>📄 View Uploaded Proof</Text>
                            </TouchableOpacity>

                            <View style={styles.actions}>
                                <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(p.id)}>
                                    <Text style={styles.rejectBtnText}>Reject</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(p.id)}>
                                    <Text style={styles.approveBtnText}>Approve</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: { padding: 20, paddingTop: 40, backgroundColor: '#111827' },
    title: { fontSize: 24, fontWeight: '800', color: '#FFFFFF' },
    subtitle: { fontSize: 14, color: '#9CA3AF', marginTop: 4 },
    listContainer: { padding: 16 },
    emptyState: { padding: 40, alignItems: 'center' },
    emptyStateText: { color: '#6B7280', fontSize: 16, textAlign: 'center' },
    card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB' },
    cardHeader: { marginBottom: 16 },
    cardTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
    cardEmail: { fontSize: 14, color: '#6B7280', marginTop: 2 },
    proofBtn: { backgroundColor: '#F3F4F6', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 16 },
    proofBtnText: { color: '#374151', fontWeight: '600', fontSize: 14 },
    actions: { flexDirection: 'row', gap: 12 },
    rejectBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#EF4444', alignItems: 'center' },
    rejectBtnText: { color: '#EF4444', fontWeight: '700', fontSize: 14 },
    approveBtn: { flex: 1, backgroundColor: '#10B981', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
    approveBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 }
});
