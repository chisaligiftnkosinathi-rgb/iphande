import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StewardButton } from './components/ui/StewardButton';
import { TruthCard } from './components/ui/TruthCard';
import { ARCHETYPE_DOCUMENT_TEMPLATES } from './data/archetypeDocumentTemplates';
import { navigateTo } from './navigation';
import { useAuth } from './src/auth/AuthContext';
import theme from './theme';

export const StewardQuickActions: React.FC = () => {
    const { selectedBusinessArchetypeKey } = useAuth();

    // 1. Resolve Allowed Templates
    const allowedTemplates = ARCHETYPE_DOCUMENT_TEMPLATES.filter(
        (t) => t.archetypeKey === selectedBusinessArchetypeKey
    );

    const hasTemplates = allowedTemplates.length > 0;

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <TruthCard style={styles.card}>
                <Text style={styles.description}>
                    Declare intent and add context to your operational timeline.
                </Text>

                <View style={styles.buttonGroup}>
                    {/* Dynamic Action: Only renders if archetype templates exist */}
                    {hasTemplates && (
                        <StewardButton
                            title="Draft Document"
                            variant="primary"
                            onPress={() => navigateTo('DocumentComposer')}
                            style={styles.actionButton}
                        />
                    )}

                    {/* Media is universally available for context gathering */}
                    <StewardButton
                        title="Declare Media Context"
                        variant={hasTemplates ? "secondary" : "primary"}
                        onPress={() => navigateTo('MediaIngestion')}
                        style={styles.actionButton}
                    />
                </View>

                {/* Gentle Continuity Message */}
                {!hasTemplates && (
                    <Text style={styles.gentleNote}>
                        Document templates are not yet configured for your archetype. Sensory context remains available.
                    </Text>
                )}
            </TruthCard>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { marginTop: theme.layout.spacing.xl },
    sectionTitle: { ...theme.typography.title, color: theme.colors.structural.charcoal, marginBottom: theme.layout.spacing.md },
    card: { backgroundColor: theme.colors.humanSpace.surface, padding: theme.layout.spacing.lg },
    description: { ...theme.typography.body, color: theme.colors.structural.slate, marginBottom: theme.layout.spacing.lg },
    buttonGroup: { marginTop: theme.layout.spacing.sm },
    // Add marginBottom to each button for spacing
    actionButton: { width: '100%', marginBottom: theme.layout.spacing.sm },
    gentleNote: {
        ...theme.typography.caption,
        color: theme.colors.structural.slateMuted,
        marginTop: theme.layout.spacing.md,
        fontStyle: 'italic',
        textAlign: 'center',
    }
});
