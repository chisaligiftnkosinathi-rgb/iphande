import React, { useCallback, useEffect, useState } from 'react';
import {
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import { createProfile, fetchBusinessCategories, fetchProfile, generateContentPost } from '../src/services/apiClient';
import type { BusinessCategory, ContentGenerationResult, Profile } from '../src/types/api';

const PROFILE_ID = 'demo'; // TODO: Replace with real profile ID from auth/session

const PROVIDER_TYPES = [
    'Individual',
    'Small Business',
    'Church',
    'Community Group',
];


const ProfileScreen: React.FC = () => {

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
        setLoading(true);
        setError(null);
        try {
            const data = await fetchProfile(PROFILE_ID);
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
    }, []);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);


    // Save Profile (POST /profiles)
    const onSave = async () => {
        setStatus('Saving...');
        try {
            // Save profile with deterministic keys
            await createProfile({
                name: displayName,
                providerType,
                businessType: business_line,
                location,
                bio,
                business_category_key,
                business_line,
            });
            // Fetch deterministic rule metadata for this identity
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
            setStatus('Save failed • stored locally');
        }
    };

    // UI
    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
            <View style={styles.profileCard}>
                <View style={styles.avatarContainer}>
                    <Image
                        source={{
                            uri:
                                profile?.avatarUrl ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName || 'User')}&background=1E3A2F&color=FFFFFF`,
                        }}
                        style={styles.avatar}
                    />
                </View>

                <Text style={styles.name} numberOfLines={2} adjustsFontSizeToFit>{displayName || 'Your Name'}</Text>

                <Text style={styles.role}>Community Growth • Opportunity Stewardship</Text>

                <Text style={styles.bio}>
                    Build meaningful opportunities, preserve reflections, and support community-centered business growth.
                </Text>

                <View style={styles.buttonRow}>
                    <Pressable style={styles.primaryButton} onPress={onSave}>
                        <Text style={styles.primaryButtonText}>Save Profile</Text>
                    </Pressable>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Profile Setup</Text>

                {/* Display name */}
                <Text style={styles.inputLabel}>Display Name</Text>
                <TextInput
                    style={styles.input}
                    value={displayName}
                    onChangeText={setDisplayName}
                    placeholder="Enter your name"
                    placeholderTextColor="#9CA3AF"
                />

                {/* Provider type chips */}
                <Text style={styles.inputLabel}>Provider Type</Text>
                <View style={styles.chipRow}>
                    {PROVIDER_TYPES.map((type) => (
                        <Pressable
                            key={type}
                            style={[styles.chip, providerType === type && styles.selectedChip]}
                            onPress={() => setProviderType(type)}
                        >
                            <Text style={[styles.chipText, providerType === type && styles.selectedChipText]}>{type}</Text>
                        </Pressable>
                    ))}
                </View>


                {/* Sector (category) chips */}
                <Text style={styles.inputLabel}>Business Sector</Text>
                <View style={styles.chipRow}>
                    {Object.entries(categories).map(([key, cat]) => (
                        <Pressable
                            key={key}
                            style={[styles.chip, business_category_key === key && styles.selectedChip]}
                            onPress={() => {
                                setBusinessCategoryKey(key);
                                setBusinessLine('');
                            }}
                        >
                            <Text style={[styles.chipText, business_category_key === key && styles.selectedChipText]}>{cat.name}</Text>
                        </Pressable>
                    ))}
                </View>

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
                    placeholderTextColor="#9CA3AF"
                />

                {/* Short bio */}
                <Text style={styles.inputLabel}>Short Bio</Text>
                <TextInput
                    style={[styles.input, { height: 80 }]}
                    value={bio}
                    onChangeText={setBio}
                    placeholder="Tell us about yourself"
                    placeholderTextColor="#9CA3AF"
                    multiline
                />

                {/* Status */}
                <View style={styles.statusCard}>
                    <Text style={styles.statusLabel}>Status</Text>
                    <Text style={styles.statusValue}>{status}</Text>
                    {error && (
                        <Text style={styles.statusError}>{error}</Text>
                    )}
                    {/* Deterministic tags and guidance */}
                    {suggestedTags.length > 0 && (
                        <View style={{ marginTop: 10 }}>
                            <Text style={{ fontWeight: '700', color: '#14532D' }}>Suggested Tags:</Text>
                            <Text>{suggestedTags.join(', ')}</Text>
                        </View>
                    )}
                    {profileGuidance.length > 0 && (
                        <View style={{ marginTop: 10 }}>
                            <Text style={{ fontWeight: '700', color: '#14532D' }}>Profile Guidance:</Text>
                            {profileGuidance.map((g, i) => (
                                <Text key={i}>• {g}</Text>
                            ))}
                        </View>
                    )}
                    {lastContent && (
                        <View style={{ marginTop: 10 }}>
                            <Text style={{ fontWeight: '700', color: '#14532D' }}>Sample Content:</Text>
                            <Text>{lastContent}</Text>
                        </View>
                    )}
                </View>
            </View>

            <View style={styles.boundaryCard}>
                <Text style={styles.boundaryTitle}>Identity & stewardship</Text>
                <Text style={styles.boundaryText}>
                    Profiles should preserve truthful user identity, public visibility controls, and evidence-linked activity history.
                </Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#F8FAF7',
    },
    content: {
        padding: 20,
        gap: 16,
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        overflow: 'hidden',
        marginBottom: 16,
        borderWidth: 2,
        borderColor: '#1E3A2F',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatar: {
        width: 96,
        height: 96,
        borderRadius: 48,
    },
    profileCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 28,
        padding: 22,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#102A20',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    name: {
        fontSize: 48,
        fontWeight: '900',
        color: '#102A20',
        letterSpacing: -1.5,
        marginBottom: 4,
        height: 92,
    },
    role: {
        fontSize: 13,
        color: '#3E6B57',
        fontWeight: '800',
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginBottom: 12,
    },
    bio: {
        textAlign: 'center',
        fontSize: 17,
        lineHeight: 30,
        color: '#4B5563',
        marginBottom: 20,
        fontWeight: '700',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    primaryButton: {
        backgroundColor: '#1E3A2F',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 16,
        alignItems: 'center',
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
    },
    secondaryButton: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 16,
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: '#1E3A2F',
        fontWeight: '700',
        fontSize: 14,
    },
    section: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginTop: 18,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#14532D',
        marginTop: 12,
        marginBottom: 6,
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 16,
        color: '#102A20',
        marginBottom: 4,
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 4,
    },
    chip: {
        backgroundColor: '#ECFDF5',
        borderRadius: 999,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#BBF7D0',
        marginBottom: 6,
    },
    chipText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#166534',
    },
    selectedChip: {
        backgroundColor: '#DCFCE7',
        borderColor: '#22C55E',
    },
    selectedChipText: {
        color: '#15803D',
        fontWeight: '900',
    },
    statusCard: {
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        padding: 16,
        marginTop: 18,
        borderWidth: 1,
        borderColor: '#BBF7D0',
        alignItems: 'flex-start',
    },
    statusLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#6B7280',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    statusValue: {
        fontSize: 15,
        fontWeight: '700',
        color: '#166534',
    },
    statusError: {
        fontSize: 13,
        color: '#B91C1C',
        marginTop: 6,
    },
    boundaryCard: {
        backgroundColor: '#ECFDF5',
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        borderColor: '#BBF7D0',
        marginTop: 18,
    },
    boundaryTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#14532D',
        marginBottom: 8,
    },
    boundaryText: {
        fontSize: 13,
        lineHeight: 20,
        color: '#166534',
    },
});

export default ProfileScreen;
