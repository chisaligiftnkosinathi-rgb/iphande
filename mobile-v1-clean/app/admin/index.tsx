import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSteward } from '../../src/state/StewardContext';
import { getAdminDashboard, DashboardStats } from '../../src/api/adminApi';
import { theme } from '../../config/theme';
import { PageHeader } from '../components/PageHeader';

export default function AdminDashboardScreen() {
    const router = useRouter();
    const { profile, isLoadingProfile } = useSteward();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isLoadingProfile && profile?.role !== 'admin') {
            Alert.alert('Access Denied', 'You do not have permission to view this page.');
            router.replace('/tabs/home');
            return;
        }

        const fetchStats = async () => {
            try {
                const data = await getAdminDashboard();
                setStats(data);
            } catch (err: any) {
                Alert.alert('Error', err.message || 'Failed to load dashboard');
            } finally {
                setLoading(false);
            }
        };

        if (profile?.role === 'admin') {
            fetchStats();
        }
    }, [profile, isLoadingProfile]);

    if (isLoadingProfile || loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <PageHeader title="Admin Portal" showBack />
                <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <PageHeader title="Admin Portal" showBack />
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                
                <Text style={styles.sectionTitle}>Platform Overview</Text>
                
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Total Profiles</Text>
                        <Text style={styles.statValue}>{stats?.total_profiles || 0}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Approved</Text>
                        <Text style={styles.statValue}>{stats?.approved_profiles || 0}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Total Opportunities</Text>
                        <Text style={styles.statValue}>{stats?.total_opportunities || 0}</Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Actions</Text>

                <TouchableOpacity 
                    style={styles.actionCard} 
                    onPress={() => router.push('/admin/payment-proofs')}
                >
                    <View style={styles.actionCardIcon}>
                        <Ionicons name="document-text" size={24} color={theme.colors.navy} />
                        {stats?.pending_reviews ? (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{stats.pending_reviews}</Text>
                            </View>
                        ) : null}
                    </View>
                    <View style={styles.actionCardContent}>
                        <Text style={styles.actionCardTitle}>Review Payment Proofs</Text>
                        <Text style={styles.actionCardDesc}>Verify R120 setup fee payments and activate stewards.</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.actionCard} 
                    onPress={() => router.push('/admin/users')}
                >
                    <View style={styles.actionCardIcon}>
                        <Ionicons name="people" size={24} color={theme.colors.navy} />
                    </View>
                    <View style={styles.actionCardContent}>
                        <Text style={styles.actionCardTitle}>Manage Users</Text>
                        <Text style={styles.actionCardDesc}>View profiles and promote/demote admins.</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.actionCard} 
                    onPress={() => router.push('/public/explore')}
                >
                    <View style={styles.actionCardIcon}>
                        <Ionicons name="briefcase" size={24} color={theme.colors.navy} />
                    </View>
                    <View style={styles.actionCardContent}>
                        <Text style={styles.actionCardTitle}>Opportunities</Text>
                        <Text style={styles.actionCardDesc}>View the public feed of posted opportunities.</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.actionCard} 
                    onPress={() => router.push('/admin/vba-console')}
                >
                    <View style={styles.actionCardIcon}>
                        <Ionicons name="server" size={24} color={theme.colors.navy} />
                    </View>
                    <View style={styles.actionCardContent}>
                        <Text style={styles.actionCardTitle}>VBA Console</Text>
                        <Text style={styles.actionCardDesc}>Visual Business Architecture overview for Platform Owners.</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.actionCard} 
                    onPress={() => router.push('/admin/payments')}
                >
                    <View style={styles.actionCardIcon}>
                        <Ionicons name="gift" size={24} color={theme.colors.navy} />
                    </View>
                    <View style={styles.actionCardContent}>
                        <Text style={styles.actionCardTitle}>Referrals & Ads Reviews</Text>
                        <Text style={styles.actionCardDesc}>Review and approve steward referrals and community ad listings.</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    container: {
        flex: 1,
    },
    content: {
        padding: 24,
        paddingBottom: 60,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 16,
        marginTop: 8,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 32,
    },
    statCard: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    statLabel: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 8,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '800',
        color: '#111827',
    },
    actionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 16,
    },
    actionCardIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: '#EF4444',
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '800',
    },
    actionCardContent: {
        flex: 1,
    },
    actionCardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    actionCardDesc: {
        fontSize: 13,
        color: '#6B7280',
        lineHeight: 18,
    },
});
