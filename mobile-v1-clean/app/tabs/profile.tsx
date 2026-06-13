import { Link, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { useSteward } from '../../src/context/StewardContext';

export default function ProfileScreen() {
    const { user, signOut } = useAuth();
    const { profile } = useSteward();
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await signOut();
            router.replace('/auth/login');
        } catch (error) {
            console.error("Failed to sign out:", error);
        }
    };

    const isAdmin = user?.email === 'glegacey97@gmail.com';

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.kicker}>Account</Text>
                <Text style={styles.title}>Steward Profile</Text>
                <Text style={styles.subtitle}>Manage your identity and access.</Text>
            </View>

            <View style={styles.section}>
                {/* Identity Card */}
                <View style={styles.card}>
                    <Text style={styles.sectionHeading}>Identity</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Name</Text>
                        <Text style={styles.value}>{profile?.name ?? "Steward"}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Email</Text>
                        <Text style={styles.value}>{profile?.email ?? user?.email ?? "Email not set"}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Phone</Text>
                        <Text style={styles.value}>{profile?.phone ?? "Phone not set"}</Text>
                    </View>
                </View>

                {/* Subscription Status Card */}
                <View style={styles.card}>
                    <Text style={styles.sectionHeading}>Subscription & Status</Text>

                    <View style={styles.statusRow}>
                        <View style={styles.statusInfo}>
                            <Text style={styles.statusTitle}>Activation</Text>
                            <Text style={styles.statusSubtitle}>Once-off verification</Text>
                        </View>
                        <View style={styles.badgeSuccess}>
                            <Text style={styles.badgeTextSuccess}>R120 PAID</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.statusRow}>
                        <View style={styles.statusInfo}>
                            <Text style={styles.statusTitle}>Pilot Stewardship Model</Text>
                            <Text style={styles.statusSubtitle}>Success-based contribution under review</Text>
                        </View>
                        <View style={styles.badgeSuccess}>
                            <Text style={styles.badgeTextSuccess}>ACTIVE</Text>
                        </View>
                    </View>
                </View>

                {/* Mission & Support */}
                <View style={styles.card}>
                    <Text style={styles.sectionHeading}>Mission & Support</Text>

                    <Link href="/support" asChild>
                        <TouchableOpacity style={styles.menuRow}>
                            <Text style={styles.menuLabel}>Help & Support</Text>
                            <Text style={styles.menuArrow}>→</Text>
                        </TouchableOpacity>
                    </Link>

                    <View style={styles.divider} />

                    <Link href="/support/giving" asChild>
                        <TouchableOpacity style={styles.menuRow}>
                            <Text style={styles.menuLabel}>Voluntary Giving</Text>
                            <Text style={styles.menuArrow}>→</Text>
                        </TouchableOpacity>
                    </Link>

                    <View style={styles.divider} />

                    <Link href="/legal" asChild>
                        <TouchableOpacity style={styles.menuRow}>
                            <Text style={styles.menuLabel}>Legal & Privacy</Text>
                            <Text style={styles.menuArrow}>→</Text>
                        </TouchableOpacity>
                    </Link>
                </View>

                {/* Settings & Admin */}
                <View style={styles.actionContainer}>
                    {isAdmin && (
                        <Link href="/admin/payments" asChild>
                            <TouchableOpacity style={styles.adminButton}>
                                <Text style={styles.adminButtonText}>Admin Control Room</Text>
                            </TouchableOpacity>
                        </Link>
                    )}

                    <Link href="/profile/settings" asChild>
                        <TouchableOpacity style={styles.secondaryButton}>
                            <Text style={styles.secondaryButtonText}>Account Settings</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        padding: 24,
        paddingTop: 56,
        paddingBottom: 32,
        backgroundColor: '#F9FAFB',
    },
    kicker: {
        fontSize: 12,
        fontWeight: '800',
        color: '#9CA3AF',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        lineHeight: 24,
    },
    section: {
        padding: 24,
        gap: 24,
    },
    card: {
        backgroundColor: '#FFFFFF',
        padding: 24,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 3,
        elevation: 1,
    },
    sectionHeading: {
        fontSize: 14,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4B5563',
    },
    value: {
        fontSize: 16,
        color: '#111827',
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusInfo: {
        flex: 1,
    },
    statusTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    statusSubtitle: {
        fontSize: 14,
        color: '#6B7280',
    },
    badgeSuccess: {
        backgroundColor: '#D1FAE5', // emerald-100
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
    },
    badgeTextSuccess: {
        color: '#065F46', // emerald-800
        fontSize: 12,
        fontWeight: '700',
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 16,
    },
    actionContainer: {
        gap: 12,
    },
    secondaryButton: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: '#111827',
        fontWeight: '800',
        fontSize: 15,
    },
    adminButton: {
        backgroundColor: '#FEF3C7',
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FDE68A',
        alignItems: 'center',
    },
    adminButtonText: {
        color: '#D97706',
        fontWeight: '800',
        fontSize: 15,
    },
    dangerButton: {
        backgroundColor: '#FEF2F2',
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FECACA',
        alignItems: 'center',
    },
    dangerButtonText: {
        color: '#DC2626',
        fontWeight: '800',
        fontSize: 15,
    },
    menuRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    menuLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4B5563',
    },
    menuArrow: {
        fontSize: 20,
        color: '#9CA3AF',
    },
});
