import { Link, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { fetchWithAuth } from '../../config/api';
import { useAuth } from '../../src/state/AuthContext';
import { useSteward } from '../../src/state/StewardContext';

export default function ProfileScreen() {
    const { user, signOut } = useAuth();
    const { profile } = useSteward();
    const router = useRouter();

    const [trustProfile, setTrustProfile] = useState<any>(null);

    const handleLogout = async () => {
        try {
            await signOut();
            router.replace('/auth/login');
        } catch (error) {
            console.error("Failed to sign out:", error);
        }
    };

    useEffect(() => {
        const fetchTrustMetrics = async () => {
            if (!profile?.id) return;
            try {
                const data = await fetchWithAuth(`/trust/profiles/${profile.id}/trust-profile`);
                setTrustProfile(data);
            } catch (error) {
                console.warn("Could not fetch trust metrics", error);
                setTrustProfile(null);
            }
        };
        fetchTrustMetrics();
    }, [profile?.id]);

    const isAdmin = profile?.role === 'admin' || profile?.role === 'system_admin' || profile?.trust_posture === 'system_creator';
    const isCreator = profile?.trust_posture === 'system_creator';

    const isActivationApproved = profile?.setup_fee_status === "approved" || profile?.is_verified === true || isAdmin;
    const isPaymentPending = profile?.setup_fee_status === "pending" || profile?.setup_fee_status === "proof_uploaded";

    let activationBadgeText = "UNPAID";
    let activationBadgeBg = "#FEF2F2"; // Red
    let activationBadgeTextColor = "#DC2626";

    if (isActivationApproved) {
        activationBadgeText = "R120 PAID";
        activationBadgeBg = "#D1FAE5"; // Green
        activationBadgeTextColor = "#065F46";
    } else if (isPaymentPending) {
        activationBadgeText = "PENDING REVIEW";
        activationBadgeBg = "#FEF3C7"; // Amber
        activationBadgeTextColor = "#D97706";
    }

    // Platform identity description variables
    let displayIdentity = "STEWARD";
    let displayAccess = "Awaiting Activation (Level 2)";
    let displayResponsibilities = "Verify business and complete setup fee.";

    if (isCreator) {
        displayIdentity = "SYSTEM CREATOR";
        displayAccess = "Full Platform Access (Level 5)";
        displayResponsibilities = "System Architecture, Platform Doctrine, Core Operations.";
    } else if (profile?.role === 'system_admin') {
        displayIdentity = "SYSTEM ADMIN";
        displayAccess = "Platform Moderation (Level 4)";
        displayResponsibilities = "Payment Reviews, User Moderation, Community Support.";
    } else if (isActivationApproved) {
        displayIdentity = "STEWARD";
        displayAccess = "Steward Tools (Level 3)";
        displayResponsibilities = "Community Service Delivery, Local Business Operation.";
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.kicker}>Account</Text>
                <Text style={styles.title}>{isCreator ? "Creator Profile" : "Steward Profile"}</Text>
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

                {/* Platform Access Card */}
                <View style={styles.card}>
                    <Text style={styles.sectionHeading}>Platform Access Info</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Platform Identity</Text>
                        <Text style={[styles.value, { fontWeight: '800', color: '#111827' }]}>{displayIdentity}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Access Level</Text>
                        <Text style={styles.value}>{displayAccess}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Responsibilities</Text>
                        <Text style={[styles.value, { flex: 1, textAlign: 'right', marginLeft: 16 }]}>{displayResponsibilities}</Text>
                    </View>
                </View>

                {/* Business Reality Card */}
                <View style={styles.card}>
                    <Text style={styles.sectionHeading}>Business Reality</Text>

                    <View style={styles.row}>
                        <Text style={styles.label}>Lineage</Text>
                        <Text style={styles.value}>
                            {profile?.business_line ?? "Not set"}
                        </Text>
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>Archetype</Text>
                        <Text
                            style={[
                                styles.value,
                                { textTransform: "capitalize" }
                            ]}
                        >
                            {String(profile?.archetype ?? "Not set")
                                .replace(/_/g, " ")}
                        </Text>
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>Category</Text>
                        <Text
                            style={[
                                styles.value,
                                { textTransform: "capitalize" }
                            ]}
                        >
                            {String(profile?.business_category_key ?? "Not set")
                                .replace(/_/g, " ")}
                        </Text>
                    </View>
                </View>

                {/* Trust Profile Card */}
                <View style={styles.card}>
                    <Text style={styles.sectionHeading}>Trust Profile</Text>
                    <Text style={[styles.subtitle, { fontSize: 13, marginBottom: 16 }]}>
                        Derived from verified identity and preserved evidence.
                    </Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Verification Status</Text>
                        <Text style={[styles.value, { fontWeight: '700', color: isActivationApproved ? '#059669' : '#D97706' }]}>
                            {isActivationApproved ? "Verified" : "Pending Activation"}
                        </Text>
                    </View>

                    {!trustProfile ? (
                        <ActivityIndicator size="small" style={{ marginVertical: 8 }} />
                    ) : (
                        <>
                            <View style={styles.row}>
                                <Text style={styles.label}>Verification Score</Text>
                                <Text style={styles.value}>{trustProfile.verification_score}</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label}>Evidence Score</Text>
                                <Text style={styles.value}>{trustProfile.evidence_score}</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label}>Continuity Score</Text>
                                <Text style={styles.value}>{trustProfile.continuity_score}</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label}>Overall Trust Score</Text>
                                <Text style={[styles.value, { fontWeight: '700' }]}>{trustProfile.trust_score}</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label}>Trust Level</Text>
                                <Text style={[styles.value, { fontWeight: '800', color: trustProfile.trust_score >= 80 ? '#059669' : '#111827' }]}>
                                    {trustProfile.trust_level}
                                </Text>
                            </View>
                        </>
                    )}
                </View>

                {/* Activation & Stewardship Card */}
                <View style={styles.card}>
                    <Text style={styles.sectionHeading}>Activation & Stewardship</Text>

                    <View style={styles.statusRow}>
                        <View style={styles.statusInfo}>
                            <Text style={styles.statusTitle}>Activation</Text>
                            <Text style={styles.statusSubtitle}>Once-off verification</Text>
                        </View>
                        <View style={[styles.badgeSuccess, { backgroundColor: activationBadgeBg }]}>
                            <Text style={[styles.badgeTextSuccess, { color: activationBadgeTextColor }]}>
                                {activationBadgeText}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.statusRow}>
                        <View style={styles.statusInfo}>
                            <Text style={styles.statusTitle}>Pilot Stewardship Model</Text>
                            <Text style={styles.statusSubtitle}>Success-based contribution</Text>
                        </View>
                        <View style={[styles.badgeSuccess, { backgroundColor: isActivationApproved ? '#D1FAE5' : '#F3F4F6' }]}>
                            <Text style={[styles.badgeTextSuccess, { color: isActivationApproved ? '#065F46' : '#6B7280' }]}>
                                {isActivationApproved ? 'ACTIVE' : 'INACTIVE'}
                            </Text>
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
                        <Link href="/admin" asChild>
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
