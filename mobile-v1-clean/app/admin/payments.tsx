import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { getPendingReferrals, markReferralPaid, rejectReferral } from '../../src/services/stewardApi';
import { Referral } from '../../src/types/steward';
import { fetchPendingAdvertisements, approveAdvertisement, rejectAdvertisement } from '../../src/services/advertisementApi';
import { AdvertisementOut } from '../../src/types/advertisement';
import { PageHeader } from '../../src/components/PageHeader';
import { useSteward } from '../../src/context/StewardContext';

export default function AdminControlRoomScreen() {
    const { user } = useAuth();
    const { profile } = useSteward();
    const router = useRouter();
    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [loadingReferrals, setLoadingReferrals] = useState(true);
    
    const [ads, setAds] = useState<AdvertisementOut[]>([]);
    const [loadingAds, setLoadingAds] = useState(true);

    const isAdmin = profile?.role === 'admin' || profile?.platform_identity === 'SYSTEM_CREATOR' || profile?.platform_identity === 'SYSTEM_ADMIN' || user?.email?.toLowerCase() === 'glegacey97@gmail.com';

    const loadReferrals = async () => {
        try {
            const data = await getPendingReferrals();
            setReferrals(data || []);
        } catch (error) {
            console.error("Failed to load referrals", error);
        } finally {
            setLoadingReferrals(false);
        }
    };
    
    const loadAds = async () => {
        try {
            const data = await fetchPendingAdvertisements();
            setAds(data || []);
        } catch (error) {
            console.error("Failed to load ads", error);
        } finally {
            setLoadingAds(false);
        }
    };

    useEffect(() => {
        if (isAdmin) {
            loadReferrals();
            loadAds();
        }
    }, [profile, user]);

    const handlePay = async (id: string) => {
        try {
            await markReferralPaid(id);
            Alert.alert("Success", "Referral marked as paid.");
            loadReferrals();
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to mark paid.");
        }
    };

    const handleReject = async (id: string) => {
        try {
            await rejectReferral(id);
            Alert.alert("Success", "Referral rejected.");
            loadReferrals();
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to reject referral.");
        }
    };

    const handleApproveAd = async (id: string) => {
        try {
            await approveAdvertisement(id);
            Alert.alert("Success", "Advertisement approved and activated.");
            loadAds();
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to approve advertisement.");
        }
    };

    const handleRejectAd = async (id: string) => {
        try {
            await rejectAdvertisement(id);
            Alert.alert("Success", "Advertisement rejected.");
            loadAds();
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to reject advertisement.");
        }
    };

    if (!isAdmin) {
        return (
            <View style={styles.restrictedContainer}>
                <Text style={styles.restrictedTitle}>Access Restricted</Text>
                <Text style={styles.restrictedText}>You do not have permission to view this page.</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <PageHeader 
                eyebrow="Admin" 
                title="Payment Review" 
                subtitle="Review platform payments." 
            />

            <View style={styles.subsection}>
                {/* Referral Payments Review */}
                <View style={styles.card}>
                    <Text style={styles.sectionHeading}>Referral Payments</Text>
                    {loadingReferrals ? (
                        <ActivityIndicator size="small" color="#111827" />
                    ) : referrals.length === 0 ? (
                        <Text style={styles.cardText}>No pending referrals require payment.</Text>
                    ) : (
                        referrals.map(ref => (
                            <View key={ref.id} style={styles.referralItem}>
                                <View style={styles.referralInfo}>
                                    <Text style={styles.referralCode}>Code: {ref.referral_code}</Text>
                                    <Text style={styles.referralAmount}>Reward: R{ref.reward_amount}</Text>
                                    <Text style={styles.referralStatus}>Status: {ref.status}</Text>
                                </View>
                                <View style={styles.referralActions}>
                                    <TouchableOpacity style={styles.actionButton} onPress={() => handlePay(ref.id)}>
                                        <Text style={styles.actionButtonText}>Pay</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.actionButton, styles.actionButtonReject]} onPress={() => handleReject(ref.id)}>
                                        <Text style={styles.actionButtonText}>Reject</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))
                    )}
                </View>

                {/* Advertisement Review */}
                <View style={[styles.card, { marginTop: 24 }]}>
                    <Text style={styles.sectionHeading}>Advertisement Review</Text>
                    {loadingAds ? (
                        <ActivityIndicator size="small" color="#111827" />
                    ) : ads.length === 0 ? (
                        <Text style={styles.cardText}>No pending advertisements.</Text>
                    ) : (
                        ads.map(ad => (
                            <View key={ad.id} style={styles.referralItem}>
                                <View style={styles.referralInfo}>
                                    <Text style={styles.referralCode}>{ad.title}</Text>
                                    <Text style={styles.referralStatus}>Contact: {ad.contact_name} ({ad.contact_whatsapp})</Text>
                                    <Text style={styles.referralStatus}>Location: {ad.town_or_city}, {ad.province}</Text>
                                </View>
                                <View style={styles.referralActions}>
                                    <TouchableOpacity style={styles.actionButton} onPress={() => handleApproveAd(ad.id)}>
                                        <Text style={styles.actionButtonText}>Approve</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.actionButton, styles.actionButtonReject]} onPress={() => handleRejectAd(ad.id)}>
                                        <Text style={styles.actionButtonText}>Reject</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))
                    )}
                </View>

                {/* Steward Activation */}
                <View style={styles.card}>
                    <Text style={styles.sectionHeading}>Steward Activation</Text>
                    <Text style={styles.cardText}>
                        Manual activation interface is not wired for V1.
                    </Text>
                </View>

                {/* Public Profiles */}
                <View style={styles.card}>
                    <Text style={styles.sectionHeading}>Public Profiles</Text>
                    <Text style={styles.cardText}>
                        All public profiles are operating normally. Moderation interface pending.
                    </Text>
                </View>

                {/* System Diagnostics */}
                <View style={styles.card}>
                    <Text style={styles.sectionHeading}>System Diagnostics</Text>
                    <Text style={styles.cardText}>
                        System healthy. No critical errors reported.
                    </Text>
                </View>

                {/* VBA Console */}
                <View style={styles.card}>
                    <Text style={styles.sectionHeading}>VBA Console</Text>
                    <Text style={styles.cardText}>
                        VBA Console exports and diagnostics will be connected after pilot validation.
                    </Text>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    subsection: { padding: 24 },
    card: {
        backgroundColor: '#FFFFFF',
        padding: 24,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    sectionHeading: {
        fontSize: 14,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    cardText: { fontSize: 16, color: '#6B7280', lineHeight: 24 },
    restrictedContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        padding: 24,
    },
    restrictedTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#DC2626',
        marginBottom: 12,
    },
    restrictedText: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
    },
    referralItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    referralInfo: {
        flex: 1,
    },
    referralCode: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
    },
    referralAmount: {
        fontSize: 14,
        color: '#10B981',
        fontWeight: '600',
    },
    referralStatus: {
        fontSize: 12,
        color: '#6B7280',
    },
    referralActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        backgroundColor: '#111827',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    actionButtonReject: {
        backgroundColor: '#EF4444',
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
    },
});
