import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppHeader } from '../components/ui/AppHeader';
import { RealityBoundary } from '../components/ui/RealityBoundary';
import { StewardButton } from '../components/ui/StewardButton';
import { TruthCard } from '../components/ui/TruthCard';
import {
    MEDIA_TYPE_REGISTRY,
    MediaAuthenticityState,
    MediaOrigin,
    MediaTypeDefinition,
    MediaVisibility
} from '../data/mediaRegistry';
import { RootStackParamList } from '../navigation';
import { useAuth } from '../src/auth/AuthContext';
import theme from '../theme';

const AUTHENTICITY_STATES: MediaAuthenticityState[] = [
    'DECLARED', 'UNVERIFIED', 'EVIDENCE_SUPPORTED', 'AI_ASSISTED', 'DERIVED'
];

const VISIBILITY_STATES: MediaVisibility[] = [
    'PUBLIC', 'STEWARD_ONLY', 'LINEAGE_RESTRICTED'
];

type Props = NativeStackScreenProps<RootStackParamList, 'MediaIngestion'>;

const MediaIngestionScreen: React.FC<Props> = ({ route }) => {
    const { selectedBusinessArchetypeKey } = useAuth();

    const { opportunity_id, target_continuity_event_id } = route.params || {};

    // Intent State
    const [selectedType, setSelectedType] = useState<MediaTypeDefinition | null>(null);
    const [origin, setOrigin] = useState<MediaOrigin | null>(null);
    const [authenticity, setAuthenticity] = useState<MediaAuthenticityState | null>(null);
    const [visibility, setVisibility] = useState<MediaVisibility | null>(null);
    const [declarationNote, setDeclarationNote] = useState('');

    const handleTypeSelection = (typeDef: MediaTypeDefinition) => {
        setSelectedType(typeDef);
        setOrigin(null); // Reset dependent states
        setVisibility(typeDef.defaultVisibility);
        setAuthenticity('DECLARED'); // Safe default
    };

    const handlePreviewPayload = () => {
        if (!selectedType || !origin || !authenticity || !visibility) {
            Alert.alert("Incomplete Declaration", "Please select provenance, authenticity, and visibility boundaries.");
            return;
        }

        // The payload ONLY includes the semantic declaration.
        // Physical file hashing, size, and mime-type will be handled by the backend ingestion pipeline.
        const payload = {
            archetype_key: selectedBusinessArchetypeKey,
            type_key: selectedType.typeKey,
            target_continuity_event_id: target_continuity_event_id || null,
            opportunity_id: opportunity_id || null,
            semantic_family: selectedType.semanticFamily,
            origin: origin,
            declared_authenticity: authenticity,
            visibility: visibility,
            metadata: {
                steward_declaration: declarationNote
            }
        };

        Alert.alert("Media Payload Preview", JSON.stringify(payload, null, 2));
    };

    return (
        <View style={{ flex: 1 }}>
            <AppHeader title="Media Declaration" />
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.subtitle}>Gathering sensory context for {selectedBusinessArchetypeKey?.replace(/_/g, ' ')}</Text>
                </View>

                {/* Step 1: Select Media Type */}
                {!selectedType ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Select Sensory Format</Text>
                        {MEDIA_TYPE_REGISTRY.map(typeDef => (
                            <Pressable
                                key={typeDef.typeKey}
                                style={styles.formatButton}
                                onPress={() => handleTypeSelection(typeDef)}
                            >
                                <Text style={styles.formatButtonText}>{typeDef.semanticFamily.replace(/_/g, ' ').toUpperCase()}</Text>
                            </Pressable>
                        ))}
                    </View>
                ) : (
                    <View style={styles.composerForm}>
                        <StewardButton title="Change Format" variant="ghost" onPress={() => setSelectedType(null)} style={styles.changeButton} />

                        <Text style={styles.templateTitle}>DECLARING: {selectedType.semanticFamily.replace('_', ' ').toUpperCase()}</Text>

                        {/* Epistemological Humility Boundaries */}
                        <RealityBoundary title="Governance Boundary">
                            {selectedType.governanceBoundary}
                        </RealityBoundary>

                        {/* Step 2: Provenance (Origin) */}
                        <TruthCard>
                            <Text style={styles.sectionLabel}>Media Origin (Provenance)</Text>
                            <Text style={styles.sectionDescription}>How did this media enter the system?</Text>
                            <View style={styles.buttonGroup}>
                                {selectedType.allowedOrigins.map(allowedOrigin => {
                                    const isSelected = origin === allowedOrigin;
                                    return (
                                        <Pressable
                                            key={allowedOrigin}
                                            style={[styles.chipButton, isSelected && styles.chipButtonSelected]}
                                            onPress={() => setOrigin(allowedOrigin)}
                                        >
                                            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{allowedOrigin.replace(/_/g, ' ')}</Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </TruthCard>

                        {/* Step 3: Authenticity Declaration */}
                        <TruthCard>
                            <Text style={styles.sectionLabel}>Declared Authenticity</Text>
                            <Text style={styles.sectionDescription}>What level of certainty does this artifact carry?</Text>
                            <View style={styles.buttonGroup}>
                                {AUTHENTICITY_STATES.map(authState => {
                                    const isSelected = authenticity === authState;
                                    return (
                                        <Pressable
                                            key={authState}
                                            style={[styles.chipButton, isSelected && styles.chipButtonSelected]}
                                            onPress={() => setAuthenticity(authState)}
                                        >
                                            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{authState.replace(/_/g, ' ')}</Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </TruthCard>

                        {/* Step 4: Visibility */}
                        <TruthCard>
                            <Text style={styles.sectionLabel}>Contextual Visibility</Text>
                            <Text style={styles.sectionDescription}>Who is permitted to view this artifact?</Text>
                            <View style={styles.buttonGroup}>
                                {VISIBILITY_STATES.map(visState => {
                                    const isSelected = visibility === visState;
                                    return (
                                        <Pressable
                                            key={visState}
                                            style={[styles.chipButton, isSelected && styles.chipButtonSelected]}
                                            onPress={() => setVisibility(visState)}
                                        >
                                            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{visState.replace(/_/g, ' ')}</Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </TruthCard>

                        {/* Step 5: Steward Declaration Note */}
                        <TruthCard>
                            <Text style={styles.sectionLabel}>Steward Declaration</Text>
                            <Text style={styles.sectionDescription}>Provide operational or spiritual context for this artifact.</Text>
                            <TextInput
                                style={styles.textInput}
                                multiline
                                placeholder="Why is this media being attached to continuity?"
                                placeholderTextColor={theme.colors.structural.slateMuted}
                                value={declarationNote}
                                onChangeText={setDeclarationNote}
                            />
                        </TruthCard>

                        <StewardButton
                            title="Simulate Media Selection & Preview Payload"
                            variant="primary"
                            onPress={handlePreviewPayload}
                            style={{ marginTop: theme.layout.spacing.lg }}
                        />
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { padding: theme.layout.spacing.lg, backgroundColor: theme.colors.humanSpace.background, paddingBottom: theme.layout.spacing.huge },
    header: { marginBottom: theme.layout.spacing.xl },
    title: { ...theme.typography.title, marginBottom: theme.layout.spacing.xs },
    subtitle: { ...theme.typography.body, color: theme.colors.structural.slate },
    section: { marginBottom: theme.layout.spacing.xl },
    sectionTitle: { ...theme.typography.heading, marginBottom: theme.layout.spacing.md },
    buttonSpacing: { marginBottom: theme.layout.spacing.sm },
    formatButton: {
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: theme.layout.radii.md,
        borderWidth: 1,
        borderColor: theme.colors.structural.slate,
        backgroundColor: theme.colors.humanSpace.surface,
        marginBottom: theme.layout.spacing.sm,
        alignItems: 'center',
    },
    formatButtonText: {
        ...theme.typography.bodyStrong,
        color: theme.colors.structural.charcoal,
    },
    composerForm: { marginTop: theme.layout.spacing.sm },
    changeButton: { alignSelf: 'flex-start', marginBottom: theme.layout.spacing.md },
    templateTitle: { ...theme.typography.eyebrow, marginBottom: theme.layout.spacing.lg, textAlign: 'center' },
    sectionLabel: { ...theme.typography.heading, marginBottom: theme.layout.spacing.xs },
    sectionDescription: { ...theme.typography.caption, marginBottom: theme.layout.spacing.md, color: theme.colors.structural.slate },
    buttonGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chipButton: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.colors.structural.slate,
        backgroundColor: theme.colors.humanSpace.surface,
    },
    chipButtonSelected: {
        backgroundColor: theme.colors.structural.charcoal,
        borderColor: theme.colors.structural.charcoal,
    },
    chipText: {
        ...theme.typography.bodyStrong,
        color: theme.colors.structural.charcoal,
    },
    chipTextSelected: {
        color: theme.colors.humanSpace.surface,
    },
    textInput: { ...theme.typography.body, backgroundColor: theme.colors.structural.borderSoft, borderRadius: theme.layout.radii.sm, padding: theme.layout.spacing.md, minHeight: 80, textAlignVertical: 'top' },
});

export default MediaIngestionScreen;
