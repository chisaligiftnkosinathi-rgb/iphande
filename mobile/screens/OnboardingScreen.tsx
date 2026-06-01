import { Picker } from '@react-native-picker/picker';
import React, { useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { StewardButton } from '../components/ui/StewardButton';
import { BUSINESS_ARCHETYPES } from '../data/businessArchetypes';
import { useAuth } from '../src/auth/AuthContext';
import theme from '../theme';


import { createProfile } from '../src/services/apiClient';

const OnboardingScreen: React.FC = () => {
    const { completeOnboarding, user, stewardId } = useAuth() as any;
    const [stewardName, setStewardName] = useState('');
    const [businessName, setBusinessName] = useState('');
    const [archetypeKey, setArchetypeKey] = useState('');
    const [location, setLocation] = useState('');
    const [story, setStory] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
                email: user.email,
                providerType: '', // Optionally add provider type field
                businessType: '', // Optionally add business type field
                location,
                bio: story,
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
            {Platform.OS === 'android' ? (
                <View style={styles.pickerWrapper}>
                    <Picker
                        selectedValue={archetypeKey}
                        onValueChange={setArchetypeKey}
                        style={styles.picker}
                    >
                        <Picker.Item label="Select archetype..." value="" />
                        {BUSINESS_ARCHETYPES.map((a) => (
                            <Picker.Item key={a.key} label={a.label} value={a.key} />
                        ))}
                    </Picker>
                </View>
            ) : (
                <TouchableOpacity style={styles.pickerWrapper}>
                    <Text style={styles.pickerText}>{
                        archetypeKey
                            ? BUSINESS_ARCHETYPES.find((a) => a.key === archetypeKey)?.label
                            : 'Select archetype...'
                    }</Text>
                </TouchableOpacity>
            )}
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
