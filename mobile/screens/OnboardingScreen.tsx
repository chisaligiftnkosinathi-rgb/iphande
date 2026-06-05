import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';
import { StewardButton } from '../components/ui/StewardButton';
import { BUSINESS_ARCHETYPES } from '../data/businessArchetypes';
import { useAuth } from '../src/auth/AuthContext';
import theme from '../theme';


import { createProfile, fetchBusinessCategories, fetchProfileByOwner } from '../src/services/apiClient';
import { makePublicSlug } from '../src/utils/profileSlug';

type ArchetypeOption = {
    key: string;
    label: string;
    description?: string;
};

const FALLBACK_ARCHETYPE_OPTIONS: ArchetypeOption[] = BUSINESS_ARCHETYPES.map((entry) => ({
    key: entry.key,
    label: entry.label,
    description: entry.description,
}));

function toBackendArchetypeOptions(
    categories: any[]
): ArchetypeOption[] {
    return categories.map((category) => ({
        key: category.key,
        label: category.name || category.label,
        description: category.description,
    }));
}

const OnboardingScreen: React.FC = () => {
    const { completeOnboarding, user, stewardId } = useAuth() as any;
    const [stewardName, setStewardName] = useState('');
    const [businessName, setBusinessName] = useState('');
    const [archetypeKey, setArchetypeKey] = useState('');
    const [location, setLocation] = useState('');
    const [story, setStory] = useState('');
    const [archetypeOptions, setArchetypeOptions] = useState<ArchetypeOption[]>(
        FALLBACK_ARCHETYPE_OPTIONS
    );
    const [categoriesError, setCategoriesError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;

        const checkProfileAndLoad = async () => {
            if (stewardId) {
                try {
                    const profile = await fetchProfileByOwner(stewardId);
                    if (active && profile && profile.id) {
                        completeOnboarding(profile.id, profile.business_category_key || '', profile.name || '');
                        return; // Auto-advance if profile exists
                    }
                } catch (e) {
                    // Profile not found, proceed to load form
                }
            }

            try {
                const categories = await fetchBusinessCategories();
                const options = toBackendArchetypeOptions(categories);
                if (!active) return;
                if (options.length > 0) {
                    setArchetypeOptions(options);
                    setCategoriesError(null);
                }
            } catch (loadError: any) {
                if (!active) return;
                setCategoriesError(loadError?.message || 'Unable to load business categories from backend.');
                setArchetypeOptions(FALLBACK_ARCHETYPE_OPTIONS);
            } finally {
                if (active) setInitializing(false);
            }
        };

        checkProfileAndLoad();
        return () => {
            active = false;
        };
    }, [stewardId]);

    const handleComplete = async () => {
        if (!user?.email) {
            setError('Missing email. Please sign in again.');
            return;
        }
        if (!stewardName || !businessName || !archetypeKey) {
            setError('Please fill all required fields.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const profile = await createProfile({
                name: businessName,
                slug: makePublicSlug(businessName),
                email: user.email,
                provider_type: '', // Optionally add provider type field
                business_type: '', // Optionally add business type field
                location,
                bio: story,
                short_bio: story,
                business_category_key: archetypeKey,
                business_line: '', // Optionally add business line field
                owner_id: stewardId,
            });
            completeOnboarding(profile.id, archetypeKey, stewardName);
        } catch (e: any) {
            setError(e.message || 'Failed to create profile');
        } finally {
            setLoading(false);
        }
    };

    if (initializing) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color={theme.colors.stewardship.text} />
                <Text style={{ marginTop: 12, ...theme.typography.body }}>Recalling business profile...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Let's set up your business home</Text>
            <Text style={styles.subtitle}>Who are you, steward?</Text>
            <TextInput
                style={styles.input}
                placeholder="Your Name (Steward)"
                value={stewardName}
                onChangeText={setStewardName}
            />
            <Text style={styles.subtitle}>What best describes your business?</Text>
            <View style={styles.pickerWrapper}>
                <Picker
                    selectedValue={archetypeKey}
                    onValueChange={setArchetypeKey}
                    style={styles.picker}
                >
                    <Picker.Item label="Select archetype..." value="" />
                    {archetypeOptions.map((a) => (
                        <Picker.Item key={a.key} label={a.label} value={a.key} />
                    ))}
                </Picker>
            </View>
            {categoriesError ? (
                <Text style={styles.warningText}>
                    Backend categories unavailable. Using local fallback list.
                </Text>
            ) : null}
            <TextInput
                style={styles.input}
                placeholder="Business Name"
                value={businessName}
                onChangeText={setBusinessName}
            />
            <TextInput
                style={styles.input}
                placeholder="Location / Operating Area"
                value={location}
                onChangeText={setLocation}
            />
            <TextInput
                style={styles.input}
                placeholder="Short Business Story"
                value={story}
                onChangeText={setStory}
                multiline
                numberOfLines={3}
            />
            {error && <Text style={{ color: 'red', marginBottom: 8 }}>{error}</Text>}
            <StewardButton
                title={loading ? 'Creating...' : 'Continue'}
                variant="primary"
                onPress={handleComplete}
                style={styles.button}
                disabled={loading || !archetypeKey || !businessName || !stewardName}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.humanSpace.background,
        padding: theme.layout.spacing.xxl,
    },
    title: {
        ...theme.typography.display,
        marginBottom: theme.layout.spacing.md,
        textAlign: 'center',
    },
    subtitle: {
        ...theme.typography.body,
        marginBottom: theme.layout.spacing.lg,
        textAlign: 'center',
        color: theme.colors.structural.slate,
    },
    pickerWrapper: {
        width: 280,
        backgroundColor: theme.colors.humanSpace.surface,
        borderColor: theme.colors.structural.border,
        borderWidth: 1,
        borderRadius: theme.layout.radii.sm,
        marginBottom: theme.layout.spacing.lg,
        paddingHorizontal: theme.layout.spacing.md,
    },
    picker: {
        width: '100%',
        height: 44,
    },
    pickerText: {
        ...theme.typography.body,
        color: theme.colors.structural.slate,
        paddingVertical: theme.layout.spacing.md,
    },
    warningText: {
        width: 280,
        ...theme.typography.body,
        color: theme.colors.evidence.textDeep,
        marginBottom: theme.layout.spacing.sm,
    },
    input: {
        width: 280,
        ...theme.typography.body,
        backgroundColor: theme.colors.humanSpace.surface,
        borderColor: theme.colors.structural.border,
        borderWidth: 1,
        borderRadius: theme.layout.radii.sm,
        padding: theme.layout.spacing.md,
        marginBottom: theme.layout.spacing.lg,
    },
    button: {
        width: 280,
        marginTop: theme.layout.spacing.md,
    },
});

export default OnboardingScreen;
