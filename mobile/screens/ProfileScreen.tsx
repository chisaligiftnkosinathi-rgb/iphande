import React, { useCallback, useEffect, useState } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import { BusinessArchetypeSelector } from '../components/profile/BusinessArchetypeSelector';
import { BusinessIdentityCard } from '../components/profile/BusinessIdentityCard';
import { ProfileContinuityBoundary } from '../components/profile/ProfileContinuityBoundary';
import { ProfileEvidenceNotice } from '../components/profile/ProfileEvidenceNotice';
import { ProviderTypeSelector } from '../components/profile/ProviderTypeSelector';
import { StewardProfileActions } from '../components/profile/StewardProfileActions';
import { TruthCard } from '../components/ui/TruthCard';
import { createProfile, fetchBusinessCategories, fetchProfileByOwner, generateContentPost } from '../src/services/apiClient';
import type { BusinessCategory, ContentGenerationResult, Profile } from '../src/types/api';
import theme from '../theme';

const PROVIDER_TYPES = [
    'Individual',
    'Small Business',
    'Church',
    'Community Group',
];


import { useAuth } from '../src/auth/AuthContext';

const ProfileScreen: React.FC = () => {

    const { user, stewardId } = useAuth() as any;
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<string>('API connection pending');

    // Editable fields
    const [displayName, setDisplayName] = useState('');
    const [providerType, setProviderType] = useState('');
    const [business_category_key, setBusinessCategoryKey] = useState('');
    const [business_line, setBusinessLine] = useState('');
    const [location, setLocation] = useState('');
    const [bio, setBio] = useState('');

    // Taxonomy
    const [categories, setCategories] = useState<Record<string, BusinessCategory>>({});

    // Deterministic rule metadata
    const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
    const [profileGuidance, setProfileGuidance] = useState<string[]>([]);
    const [lastContent, setLastContent] = useState<string>('');

    // Load taxonomy
    useEffect(() => {
        fetchBusinessCategories()
            .then(setCategories)
            .catch(() => setCategories({}));
    }, []);


    // Load profile from backend
    const loadProfile = useCallback(async () => {
        if (!stewardId) {
            setLoading(false);
            setError(null);
            setProfile(null);
            setStatus('API connection pending');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const data = await fetchProfileByOwner(stewardId);
            setProfile(data);
            setDisplayName(data.name || '');
            setProviderType(data['providerType'] || '');
            setBusinessCategoryKey(data.business_category_key || '');
            setBusinessLine(data.business_line || '');
            setLocation(data.location || '');
            setBio(data['bio'] || '');
            setStatus('API synced');
        } catch (err: any) {
            setError(err.message || 'Failed to load profile');
            setStatus('API connection pending');
        } finally {
            setLoading(false);
        }
    }, [stewardId]);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);


    // Save Profile (POST /profiles)
    const onSave = async () => {
        setStatus('Saving...');
        try {
            await createProfile({
                name: displayName,
                email: user?.email || '',
                providerType,
                businessType: business_line,
                location,
                bio,
                business_category_key,
                business_line,
                owner_id: stewardId,
            });
            if (business_category_key && business_line) {
                const result: ContentGenerationResult = await generateContentPost({
                    business_category_key,
                    business_line,
                    goal_key: 'promote_today',
                });
                setSuggestedTags(result.suggested_tags || []);
                setProfileGuidance(result.profile_guidance || []);
                setLastContent(result.content || '');
            }
            setStatus('Profile saved • API synced');
        } catch (err: any) {
            setStatus('Save failed • changes were not synced');
        }
    };

    const isSaving = status === 'Saving...';

    // UI
    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
            <BusinessIdentityCard displayName={displayName} avatarUrl={profile?.avatarUrl} />

            <StewardProfileActions onSave={onSave} isSaving={isSaving} />

            <TruthCard>
                <Text style={styles.sectionTitle}>Profile Setup</Text>

                {/* Display name */}
                <Text style={styles.inputLabel}>Display Name</Text>
                <TextInput
                    style={styles.input}
                    value={displayName}
                    onChangeText={setDisplayName}
                    placeholder="Enter your name"
                    placeholderTextColor={theme.colors.structural.slateMuted}
                />

                {/* Provider type chips */}
                <Text style={styles.inputLabel}>Provider Type</Text>
                <ProviderTypeSelector
                    selectedProviderType={providerType}
                    onSelectProviderType={setProviderType}
                />


                {/* Business archetype selector */}
                <Text style={styles.inputLabel}>Business Archetype</Text>
                <BusinessArchetypeSelector
                    selectedArchetypeKey={business_category_key}
                    onSelectArchetype={(key) => {
                        setBusinessCategoryKey(key);
                        setBusinessLine('');
                    }}
                />

                {/* Business line chips (shown after sector selection) */}
                {business_category_key && categories[business_category_key] && (
                    <>
                        <Text style={styles.inputLabel}>Business Line</Text>
                        <View style={styles.chipRow}>
                            {categories[business_category_key].lines.map((line) => (
                                <Pressable
                                    key={line}
                                    style={[styles.chip, business_line === line && styles.selectedChip]}
                                    onPress={() => setBusinessLine(line)}
                                >
                                    <Text style={[styles.chipText, business_line === line && styles.selectedChipText]}>{line}</Text>
                                </Pressable>
                            ))}
                        </View>
                    </>
                )}

                {/* Location */}
                <Text style={styles.inputLabel}>Location</Text>
                <TextInput
                    style={styles.input}
                    value={location}
                    onChangeText={setLocation}
                    placeholder="Enter your location"
                    placeholderTextColor={theme.colors.structural.slateMuted}
                />

                {/* Short bio */}
                <Text style={styles.inputLabel}>Short Bio</Text>
                <TextInput
                    style={[styles.input, { height: 80 }]}
                    value={bio}
                    onChangeText={setBio}
                    placeholder="Tell us about yourself"
                    placeholderTextColor={theme.colors.structural.slateMuted}
                    multiline
                />
            </TruthCard>

            <ProfileEvidenceNotice
                status={status}
                error={error}
                suggestedTags={suggestedTags}
                profileGuidance={profileGuidance}
                lastContent={lastContent}
            />

            <ProfileContinuityBoundary />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: theme.colors.humanSpace.background,
    },
    content: {
        padding: theme.layout.spacing.xl,
    },
    sectionTitle: {
        ...theme.typography.title,
        fontSize: 20,
        color: theme.colors.structural.charcoal,
        marginBottom: theme.layout.spacing.lg,
    },
    inputLabel: {
        ...theme.typography.bodyStrong,
        color: theme.colors.structural.charcoalLight,
        marginTop: theme.layout.spacing.md,
        marginBottom: theme.layout.spacing.xs,
    },
    input: {
        backgroundColor: theme.colors.humanSpace.background,
        borderRadius: theme.layout.radii.sm,
        borderWidth: 1,
        borderColor: theme.colors.structural.border,
        paddingHorizontal: theme.layout.spacing.md,
        paddingVertical: theme.layout.spacing.md,
        ...theme.typography.body,
        color: theme.colors.structural.charcoal,
        marginBottom: theme.layout.spacing.xs,
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.layout.spacing.md,
        marginBottom: theme.layout.spacing.xs,
    },
    chip: {
        backgroundColor: theme.colors.stewardship.bg,
        borderRadius: theme.layout.radii.pill,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: theme.colors.stewardship.border,
    },
    chipText: {
        ...theme.typography.caption,
        color: theme.colors.stewardship.textDeep,
    },
    selectedChip: {
        backgroundColor: theme.colors.stewardship.text,
        borderColor: theme.colors.stewardship.textDeep,
    },
    selectedChipText: {
        color: theme.colors.humanSpace.surface,
        fontWeight: '900',
    },
});

export default ProfileScreen;
