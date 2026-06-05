import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { API_BASE_URL } from '../src/config/api';
import { checkApiHealth, fetchProfile } from '../src/services/apiClient';
import type { Profile } from '../src/types/api';
import theme from '../theme';

const PROFILE_ID = 'demo'; // TODO: Replace with real profile ID from auth/session

const BusinessHomeScreen: React.FC = () => {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [healthStatus, setHealthStatus] = useState('checking /health...');

    useEffect(() => {
        const loadHealth = async () => {
            try {
                const result = await checkApiHealth();
                setHealthStatus(result.ok ? `health ok (${result.status})` : `health warning (${result.status})`);
            } catch (err: any) {
                setHealthStatus(`health failed: ${err.message || 'unknown error'}`);
            }
        };

        const loadProfile = async () => {
            try {
                setLoading(true);
                const data = await fetchProfile(PROFILE_ID);
                setProfile(data);
            } catch (err: any) {
                setError(err.message || 'Failed to load business profile.');
            } finally {
                setLoading(false);
            }
        };
        loadHealth();
        loadProfile();
    }, []);

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={theme.colors.stewardship.text} />
                <Text style={styles.muted}>Loading business presence...</Text>
                <Text style={styles.debugText}>API: {API_BASE_URL}</Text>
                <Text style={styles.debugText}>{healthStatus}</Text>
            </View>
        );
    }

    if (error || !profile) {
        return (
            <View style={[styles.container, styles.center]}>
                <Text style={styles.errorText}>{error || 'Business profile not found.'}</Text>
                <Text style={styles.debugText}>API: {API_BASE_URL}</Text>
                <Text style={styles.debugText}>{healthStatus}</Text>
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.debugBox}>
                <Text style={styles.debugText}>API: {API_BASE_URL}</Text>
                <Text style={styles.debugText}>{healthStatus}</Text>
            </View>

            {/* Business Identity */}
            <View style={styles.header}>
                <View style={styles.logoCircle}>
                    <Text style={styles.logoText}>
                        {profile.name ? profile.name.charAt(0).toUpperCase() : '?'}
                    </Text>
                </View>
                <Text style={styles.name}>{profile.name || 'Unnamed Business'}</Text>
                {profile.business_category_key ? (
                    <Text style={styles.archetype}>{profile.business_category_key.replace(/_/g, ' ')}</Text>
                ) : null}
            </View>

            {/* Business Story */}
            {profile.bio ? <Text style={styles.story}>{profile.bio}</Text> : null}

            {/* Services */}
            {profile.business_line ? (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Primary Business Line</Text>
                    <Text style={styles.serviceItem}>• {profile.business_line}</Text>
                </View>
            ) : null}

            {/* Operating Area & Hours */}
            {profile.location ? (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Location</Text>
                    <Text style={styles.sectionValue}>{profile.location}</Text>
                </View>
            ) : null}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: theme.layout.spacing.xxl,
        backgroundColor: theme.colors.humanSpace.background,
        paddingBottom: theme.layout.spacing.huge,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: {
        alignItems: 'flex-start',
        marginBottom: theme.layout.spacing.xxl,
    },
    logoCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: theme.colors.structural.borderSoft,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.layout.spacing.md,
    },
    logoText: {
        fontSize: theme.typography.display.fontSize,
        color: theme.colors.structural.slateMuted,
        fontWeight: 'bold',
    },
    name: {
        ...theme.typography.display,
        marginBottom: theme.layout.spacing.sm,
    },
    archetype: {
        ...theme.typography.eyebrow,
        marginBottom: theme.layout.spacing.md,
        textTransform: 'capitalize',
    },
    story: {
        ...theme.typography.body,
        marginBottom: theme.layout.spacing.xxl,
        textAlign: 'left',
    },
    section: {
        marginBottom: theme.layout.spacing.xxl,
    },
    sectionTitle: {
        ...theme.typography.heading,
        marginBottom: theme.layout.spacing.sm,
    },
    serviceItem: {
        ...theme.typography.body,
        marginLeft: theme.layout.spacing.sm,
        marginBottom: theme.layout.spacing.xs,
    },
    sectionRow: {
        flexDirection: 'row',
        marginBottom: theme.layout.spacing.xxl,
    },
    sectionHalf: {
        flex: 1,
        paddingRight: theme.layout.spacing.md,
    },
    sectionValue: {
        ...theme.typography.body,
    },
    ctaRow: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginBottom: theme.layout.spacing.xxl,
        gap: theme.layout.spacing.md,
    },
    muted: {
        ...theme.typography.body,
        color: theme.colors.structural.slateMuted,
        marginTop: theme.layout.spacing.md,
    },
    errorText: {
        ...theme.typography.heading,
        color: theme.colors.resolution.textDeep,
    },
    debugBox: {
        backgroundColor: theme.colors.evidence.bg,
        borderColor: theme.colors.evidence.border,
        borderRadius: theme.layout.radii.sm,
        borderWidth: 1,
        padding: theme.layout.spacing.sm,
        marginBottom: theme.layout.spacing.lg,
    },
    debugText: {
        ...theme.typography.caption,
        color: theme.colors.evidence.textDeep,
        marginTop: theme.layout.spacing.xs,
        textAlign: 'center',
    },
});

export default BusinessHomeScreen;
