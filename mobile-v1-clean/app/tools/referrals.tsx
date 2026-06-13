import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import { getMyReferrals } from '../../src/services/stewardApi';
import { ReferralMeResponse } from '../../src/types/steward';
import { PageHeader } from '../../src/components/PageHeader';

export default function ReferralsScreen() {
    const [data, setData] = useState<ReferralMeResponse | null>(null);
    const [loading, setLoading] = useState(true);

    const loadReferrals = async () => {
        try {
            const response = await getMyReferrals();
            setData(response);
        } catch (error) {
            console.error("Failed to load referrals:", error);
            Alert.alert("Error", "Could not load referral data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReferrals();
    }, []);

    const handleCopy = async () => {
        if (data?.referral_code) {
            await Clipboard.setStringAsync(data.referral_code);
            Alert.alert("Copied!", "Referral code copied to clipboard.");
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid': return '#10B981'; // Green
            case 'qualified': return '#3B82F6'; // Blue
            case 'pending': return '#F59E0B'; // Amber
            case 'rejected': return '#EF4444'; // Red
            default: return '#6B7280'; // Gray
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#111827" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <Stack.Screen options={{ title: "Referral Program", headerBackTitle: "Back" }} />

            <PageHeader 
                eyebrow="Steward Tools" 
                title="Referral Program" 
                subtitle="Invite stewards and earn rewards." 
            />

            <View style={styles.subsection}>
                <View style={styles.codeCard}>
                    <Text style={styles.codeLabel}>YOUR REFERRAL CODE</Text>
                    <View style={styles.codeRow}>
                        <Text style={styles.codeText}>{data?.referral_code || "UNAVAILABLE"}</Text>
                        <TouchableOpacity style={styles.copyButton} onPress={handleCopy}>
                            <Ionicons name="copy-outline" size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.codeNote}>Tell your friends to enter this code when setting up their profile.</Text>
                </View>
            </View>

            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>SUCCESSFUL</Text>
                    <Text style={styles.statValue}>{data?.successful_referrals || 0} / 5</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>EARNED</Text>
                    <Text style={styles.statValue}>R {data?.total_reward || 0}</Text>
                </View>
            </View>

            <View style={styles.subsection}>
                <Text style={styles.sectionTitle}>History</Text>
                {(!data?.referrals || data.referrals.length === 0) ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="people-outline" size={32} color="#9CA3AF" style={{marginBottom: 8}} />
                        <Text style={styles.emptyText}>You haven't referred anyone yet.</Text>
                    </View>
                ) : (
                    <View style={styles.list}>
                        {data.referrals.map((ref) => (
                            <View key={ref.id} style={styles.listItem}>
                                <View style={styles.listLeft}>
                                    <Text style={styles.itemTitle}>Steward Registration</Text>
                                    <Text style={styles.itemDate}>{new Date(ref.created_at).toLocaleDateString()}</Text>
                                    {ref.reason && <Text style={styles.itemReason}>Reason: {ref.reason}</Text>}
                                </View>
                                <View style={styles.listRight}>
                                    <Text style={[styles.itemStatus, { color: getStatusColor(ref.status) }]}>
                                        {ref.status.toUpperCase()}
                                    </Text>
                                    <Text style={styles.itemReward}>R {ref.reward_amount}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
    },
    headerIcon: {
        marginBottom: 16,
    },
    subsection: {
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    codeCard: {
        backgroundColor: '#111827',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
    },
    codeLabel: {
        color: '#9CA3AF',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 12,
    },
    codeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1F2937',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        width: '100%',
    },
    codeText: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: '800',
        flex: 1,
        textAlign: 'center',
        letterSpacing: 2,
    },
    copyButton: {
        padding: 8,
        backgroundColor: '#374151',
        borderRadius: 8,
    },
    codeNote: {
        color: '#9CA3AF',
        fontSize: 13,
        textAlign: 'center',
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        gap: 16,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: '#9CA3AF',
        letterSpacing: 1,
        marginBottom: 8,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '800',
        color: '#111827',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 16,
    },
    emptyState: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 32,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 15,
        color: '#6B7280',
    },
    list: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        overflow: 'hidden',
    },
    listItem: {
        flexDirection: 'row',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        alignItems: 'center',
    },
    listLeft: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    itemDate: {
        fontSize: 13,
        color: '#6B7280',
    },
    itemReason: {
        fontSize: 12,
        color: '#EF4444',
        marginTop: 4,
    },
    listRight: {
        alignItems: 'flex-end',
    },
    itemStatus: {
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    itemReward: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
    },
});
