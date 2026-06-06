import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppHeader } from '../components/ui/AppHeader';
import { RealityBoundary } from '../components/ui/RealityBoundary';
import { StewardButton } from '../components/ui/StewardButton';
import { TruthCard } from '../components/ui/TruthCard';
import { ARCHETYPE_DOCUMENT_TEMPLATES } from '../data/archetypeDocumentTemplates';
import { ARCHETYPE_STANDARD_REGISTRY } from '../data/archetypeStandardRegistry';
import { TEMPLATE_SECTION_REGISTRY } from '../data/templateSectionRegistry';
import { RootStackParamList } from '../navigation';
import { useAuth } from '../src/auth/AuthContext';
import theme from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'DocumentComposer'>;

const DocumentComposerScreen: React.FC<Props> = ({ route }) => {
    const navigation = useNavigation<any>();
    const { selectedBusinessArchetypeKey } = useAuth();
    const [selectedTemplateKey, setSelectedTemplateKey] = useState<string | null>(null);
    const [stewardInputs, setStewardInputs] = useState<Record<string, string>>({});

    const { opportunity_id, target_continuity_event_id } = route.params || {};

    // 1. Resolve Available Templates based on Archetype
    const availableTemplates = ARCHETYPE_DOCUMENT_TEMPLATES.filter(
        (t) => t.archetypeKey === selectedBusinessArchetypeKey
    );

    // 2. Resolve Applicable Standards
    const applicableStandards = ARCHETYPE_STANDARD_REGISTRY.filter(
        (s) => s.applicableArchetypes.includes(selectedBusinessArchetypeKey || '')
    );

    const selectedTemplate = availableTemplates.find(t => t.templateKey === selectedTemplateKey);

    const handleInputChange = (sectionKey: string, text: string) => {
        setStewardInputs(prev => ({ ...prev, [sectionKey]: text }));
    };

    const handlePreviewDraft = () => {
        if (!selectedTemplate) return;

        // The payload ONLY includes mutable sections declared by the steward.
        // Immutable, System Generated, and Identity blocks are omitted.
        const payload = {
            archetype_key: selectedBusinessArchetypeKey,
            template_key: selectedTemplate.templateKey,
            parent_event_id: target_continuity_event_id || opportunity_id || null,
            sections: Object.keys(stewardInputs).map(key => ({
                section_key: key,
                content: { text: stewardInputs[key] }
            }))
        };

        Alert.alert(
            "Draft preservation endpoint pending",
            "Payload preview:\n\n" + JSON.stringify(payload, null, 2)
        );
    };

    return (
        <View style={{ flex: 1 }}>
            <AppHeader title="Document Composer" />
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.subtitle}>Gathering intent for {selectedBusinessArchetypeKey?.replace(/_/g, ' ')}</Text>
                </View>

                {/* Template Selection */}
                {!selectedTemplate ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Select Continuity Artifact</Text>
                        {availableTemplates.map(template => (
                            <StewardButton
                                key={template.templateKey}
                                title={template.titlePattern.replace(' - {Title}', '').replace(' - {ClientName}', '').replace(' - {Month}', '')}
                                variant="secondary"
                                style={styles.templateButton}
                                onPress={() => setSelectedTemplateKey(template.templateKey)}
                            />
                        ))}
                        {availableTemplates.length === 0 && (
                            <RealityBoundary>No templates currently defined for this archetype.</RealityBoundary>
                        )}
                    </View>
                ) : (
                    <View style={styles.composerForm}>
                        <StewardButton title="Change Template" variant="ghost" onPress={() => setSelectedTemplateKey(null)} style={styles.changeButton} />

                        <Text style={styles.templateTitle}>{selectedTemplate.documentType.replace('_', ' ').toUpperCase()}</Text>

                        {/* Render Template Sections */}
                        {selectedTemplate.sections.map(sectionKey => {
                            const sectionDef = TEMPLATE_SECTION_REGISTRY.find(s => s.sectionKey === sectionKey);
                            if (!sectionDef) return null;

                            const isMutable = sectionDef.mutability === 'mutable';

                            if (isMutable) {
                                return (
                                    <TruthCard key={sectionKey}>
                                        <Text style={styles.sectionLabel}>{sectionDef.sectionLabel}</Text>
                                        <Text style={styles.sectionDescription}>{sectionDef.description}</Text>
                                        <TextInput
                                            style={styles.textInput}
                                            multiline
                                            placeholder="Enter your declaration here..."
                                            placeholderTextColor={theme.colors.structural.slateMuted}
                                            value={stewardInputs[sectionKey] || ''}
                                            onChangeText={(text) => handleInputChange(sectionKey, text)}
                                        />
                                    </TruthCard>
                                );
                            } else {
                                // Render read-only boundaries for systemic, identity, and immutable sections
                                return (
                                    <RealityBoundary key={sectionKey} title={sectionDef.sectionLabel}>
                                        {sectionDef.mutability === 'system_generated'
                                            ? "This section will be securely generated by the Causal River upon submission."
                                            : sectionDef.mutability === 'readonly'
                                                ? "This section will be securely injected from your governed profile."
                                                : "This section is standard-mandated and structurally immutable."}
                                    </RealityBoundary>
                                );
                            }
                        })}

                        {/* Applicable Standard Disclosures */}
                        {applicableStandards.length > 0 && (
                            <View style={styles.standardsBox}>
                                <Text style={styles.sectionLabel}>Applicable Governance Standards</Text>
                                {applicableStandards.map(std => (
                                    <Text key={std.standardKey} style={styles.disclosureText}>
                                        {std.disclosureBoundary}
                                    </Text>
                                ))}
                            </View>
                        )}

                        <View style={styles.submitContainer}>
                            <StewardButton
                                title="Preview Draft Payload"
                                variant="primary"
                                onPress={handlePreviewDraft}
                            />
                        </View>
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
    templateButton: { marginBottom: theme.layout.spacing.sm },
    composerForm: { marginTop: theme.layout.spacing.sm },
    changeButton: { alignSelf: 'flex-start', marginBottom: theme.layout.spacing.md },
    templateTitle: { ...theme.typography.eyebrow, marginBottom: theme.layout.spacing.lg, textAlign: 'center' },
    sectionLabel: { ...theme.typography.heading, marginBottom: theme.layout.spacing.xs },
    sectionDescription: { ...theme.typography.caption, marginBottom: theme.layout.spacing.sm, color: theme.colors.structural.slate },
    textInput: { ...theme.typography.body, backgroundColor: theme.colors.structural.borderSoft, borderRadius: theme.layout.radii.sm, padding: theme.layout.spacing.md, minHeight: 100, textAlignVertical: 'top' },
    standardsBox: { backgroundColor: theme.colors.reality.bg, padding: theme.layout.spacing.lg, borderRadius: theme.layout.radii.sm, marginBottom: theme.layout.spacing.xl, borderLeftWidth: 4, borderLeftColor: theme.colors.structural.slateMuted },
    disclosureText: { ...theme.typography.caption, fontStyle: 'italic', marginTop: theme.layout.spacing.sm },
    submitContainer: { position: 'relative', justifyContent: 'center' },
});

export default DocumentComposerScreen;
