import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { useSteward } from '../../src/context/StewardContext';
import { ArchetypeGroup, getArchetypeGroups, TradeArchetype } from '../../src/domain/tradeArchetypeTree';
import { updateMe } from '../../src/services/stewardApi';

export default function OnboardingScreen() {
    const { user } = useAuth();
    const { profile, refreshProfile } = useSteward();
    const router = useRouter();

    const [step, setStep] = useState(1);
    const [archetypeGroups] = useState(getArchetypeGroups);
    const [selectedGroup, setSelectedGroup] = useState<ArchetypeGroup | null>(null);

    const [businessName, setBusinessName] = useState('');
    const [archetypeKey, setArchetypeKey] = useState('');
    const [selectedArchetype, setSelectedArchetype] = useState<TradeArchetype | null>(null);
    const [location, setLocation] = useState('');
    const [whatsapp, setWhatsapp] = useState('');

    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (!profile) return;
        setBusinessName(profile.name ?? '');
        setArchetypeKey(profile.archetype ?? '');
        setLocation(profile.location ?? "");
        setWhatsapp(profile.phone ?? "");
    }, [profile]);

    const nextStep = () => setStep(s => Math.min(s + 1, 4));
    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    const handleCompleteSetup = async () => {
        setErrorMessage('');
        if (!user) {
            setErrorMessage("You must be logged in to complete setup.");
            return;
        }

        setLoading(true);
        let formattedWhatsapp = whatsapp.replace(/[^0-9]/g, '');
        if (formattedWhatsapp.startsWith('0')) {
            formattedWhatsapp = '27' + formattedWhatsapp.substring(1);
        }

        try {
            await updateMe({
                name: businessName,
                archetype: archetypeKey,
                business_category_key: archetypeKey,
                business_line: selectedArchetype?.features.trustLineage,
                location,
                phone: formattedWhatsapp,
                contact_method: 'whatsapp',
                onboarding_completed: true,
                is_public: true,
            });

            await refreshProfile();
            router.replace("/activation");
        } catch (error: any) {
            console.error("Onboarding Error:", error);
            setErrorMessage("Failed to save profile. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>What should people call you?</Text>
                        <Text style={styles.cardSubtitle}>This is your business or stewardship name.</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Mandla Auto Repairs"
                            placeholderTextColor="#9CA3AF"
                            value={businessName}
                            onChangeText={setBusinessName}
                            autoFocus
                        />
                        <TouchableOpacity
                            style={[styles.primaryButton, !businessName.trim() && styles.buttonDisabled]}
                            onPress={nextStep}
                            disabled={!businessName.trim()}
                        >
                            <Text style={styles.primaryButtonText}>Next</Text>
                        </TouchableOpacity>
                    </View>
                );
            case 2:
                return (
                    !selectedGroup ? (
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>What kind of steward are you?</Text>
                            <Text style={styles.cardSubtitle}>Select the group that best describes your work.</Text>
                            <View style={styles.pillContainer}>
                                {archetypeGroups().map((group) => (
                                    <TouchableOpacity
                                        key={group.key}
                                        style={styles.pill}
                                        onPress={() => setSelectedGroup(group)}
                                    >
                                        <Text style={styles.pillText}>{group.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <TouchableOpacity style={[styles.secondaryButton, { marginTop: 16 }]} onPress={prevStep}>
                                <Text style={styles.secondaryButtonText}>Back</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>{selectedGroup.label}</Text>
                            <Text style={styles.cardSubtitle}>{selectedGroup.description}</Text>
                            <View style={styles.pillContainer}>
                                {Object.values(selectedGroup.archetypes).map((archetype) => (
                                    <TouchableOpacity
                                        key={archetype.key}
                                        style={[styles.pill, archetypeKey === archetype.key && styles.pillActive]}
                                        onPress={() => {
                                            setArchetypeKey(archetype.key);
                                            setSelectedArchetype(archetype);
                                            setTimeout(nextStep, 300); // Auto-advance for magic feel
                                        }}
                                    >
                                        <Text style={[styles.pillText, archetypeKey === archetype.key && styles.pillTextActive]}>
                                            {archetype.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <TouchableOpacity style={[styles.secondaryButton, { marginTop: 16 }]} onPress={() => setSelectedGroup(null)}>
                                <Text style={styles.secondaryButtonText}>Back to Groups</Text>
                            </TouchableOpacity>
                        </View>
                    )
                );
            case 3:
                return (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Where do you work?</Text>
                        <Text style={styles.cardSubtitle}>Customers need to know your primary area.</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Klarinet, Emalahleni"
                            placeholderTextColor="#9CA3AF"
                            value={location}
                            onChangeText={setLocation}
                            autoFocus
                        />
                        <View style={styles.buttonRow}>
                            <TouchableOpacity style={styles.secondaryButton} onPress={prevStep}>
                                <Text style={styles.secondaryButtonText}>Back</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.primaryButton, { flex: 1 }, !location.trim() && styles.buttonDisabled]}
                                onPress={nextStep}
                                disabled={!location.trim()}
                            >
                                <Text style={styles.primaryButtonText}>Next</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                );
            case 4:
                return (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>How can customers contact you?</Text>
                        <Text style={styles.cardSubtitle}>Your WhatsApp number for receiving leads.</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. 082 123 4567"
                            placeholderTextColor="#9CA3AF"
                            value={whatsapp}
                            onChangeText={setWhatsapp}
                            keyboardType="phone-pad"
                            autoFocus
                        />
                        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
                        <View style={styles.buttonRow}>
                            <TouchableOpacity style={styles.secondaryButton} onPress={prevStep} disabled={loading}>
                                <Text style={styles.secondaryButtonText}>Back</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.primaryButton, { flex: 1 }, (!whatsapp.trim() || loading) && styles.buttonDisabled]}
                                onPress={handleCompleteSetup}
                                disabled={!whatsapp.trim() || loading}
                            >
                                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Become Visible 🎉</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                );
            default:
                return null;
        }
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <View style={styles.header}>
                    <Text style={styles.kicker}>Welcome to iPhande</Text>
                    <Text style={styles.title}>Let's make your business visible.</Text>
                    <Text style={styles.subtitle}>This takes less than 1 minute.</Text>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { width: `${(step / 4) * 100}%` }]} />
                </View>

                {renderStepContent()}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    content: {
        padding: 24,
        paddingBottom: 48,
    },
    header: {
        marginBottom: 32,
        marginTop: 24,
    },
    kicker: { fontSize: 12, fontWeight: '800', color: '#9CA3AF', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 },
    title: { fontSize: 32, fontWeight: '800', color: '#111827', marginBottom: 8 },
    subtitle: { fontSize: 16, color: '#6B7280', lineHeight: 24 },
    form: { gap: 24, marginBottom: 32 },
    sectionBlock: { backgroundColor: '#FFFFFF', padding: 24, borderRadius: 16, borderWidth: 1, borderColor: '#F3F4F6', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 16 },
    card: { backgroundColor: '#FFFFFF', padding: 24, borderRadius: 16, borderWidth: 1, borderColor: '#F3F4F6', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1, marginBottom: 24 },
    cardTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 8 },
    cardSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 24 },
    buttonRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
    secondaryButton: { padding: 16, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
    secondaryButtonText: { color: '#374151', fontWeight: '700', fontSize: 16 },
    progressContainer: { height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, marginBottom: 32, overflow: 'hidden' },
    progressBar: { height: '100%', backgroundColor: '#10B981', borderRadius: 3 },
    label: { fontSize: 14, fontWeight: '700', color: '#374151', marginTop: 12, marginBottom: 6 },
    helperText: { fontSize: 13, color: '#6B7280', marginBottom: 12 },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#111827',
    },
    textArea: { height: 120 },
    imagePickerButton: { backgroundColor: '#FFFFFF', padding: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 12, borderStyle: 'dashed' },
    imagePickerButtonText: { color: '#374151', fontSize: 14, fontWeight: '600' },
    thumbnail: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#E5E7EB', alignSelf: 'center', marginBottom: 16 },
    coverPreview: { width: '100%', aspectRatio: 16 / 9, borderRadius: 8, backgroundColor: '#E5E7EB', marginBottom: 16, resizeMode: 'cover' },
    galleryScroll: { flexDirection: 'row', marginBottom: 16 },
    galleryImageContainer: { marginRight: 12, position: 'relative' },
    galleryImage: { width: 100, height: 100, borderRadius: 8, backgroundColor: '#E5E7EB' },
    removeImageBtn: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.5)', width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    removeImageText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
    addGalleryBtn: { width: 100, height: 100, borderRadius: 8, borderWidth: 2, borderColor: '#E5E7EB', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB' },
    addGalleryText: { color: '#6B7280', fontSize: 12, fontWeight: '600', marginTop: 4 },
    pillContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    pill: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    pillActive: {
        backgroundColor: '#111827',
        borderColor: '#111827',
    },
    pillText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4B5563',
    },
    pillTextActive: {
        color: '#FFFFFF',
    },
    errorText: {
        color: '#DC2626',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 16,
        textAlign: 'center',
    },
    primaryButton: {
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#111827',
        alignItems: 'center',
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 16,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
});
