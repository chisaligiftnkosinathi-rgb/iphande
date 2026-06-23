import React from 'react';
import { StyleSheet, View } from 'react-native';
import { StewardButton } from './components/ui/StewardButton';
import { ARCHETYPE_DOCUMENT_TEMPLATES } from './data/archetypeDocumentTemplates';
import { navigateTo } from './navigation';
import { useAuth } from './src/auth/AuthContext';
import theme from './theme';

export interface OpportunityQuickActionsProps {
    opportunityId: string;
    targetContinuityEventId?: string;
}

export const OpportunityQuickActions: React.FC<OpportunityQuickActionsProps> = ({
    opportunityId,
    targetContinuityEventId,
}) => {
    const { selectedBusinessArchetypeKey } = useAuth();

    // Resolve Allowed Templates
    const allowedTemplates = ARCHETYPE_DOCUMENT_TEMPLATES.filter(
        (t) => t.archetypeKey === selectedBusinessArchetypeKey
    );

    const hasTemplates = allowedTemplates.length > 0;

    return (
        <View style={styles.container}>
            {hasTemplates && (
                <StewardButton
                    title="Draft Contextual Document"
                    variant="secondary"
                    onPress={() => navigateTo('DocumentComposer', { opportunity_id: opportunityId, target_continuity_event_id: targetContinuityEventId })}
                    style={styles.actionButton}
                />
            )}
            <StewardButton
                title="Declare Contextual Media"
                variant="secondary"
                onPress={() => navigateTo('MediaIngestion', { opportunity_id: opportunityId, target_continuity_event_id: targetContinuityEventId })}
                style={styles.actionButton}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flexDirection: 'row', flexWrap: 'wrap', marginTop: theme.layout.spacing.sm },
    actionButton: { flex: 1, minWidth: '45%', paddingVertical: 10, marginBottom: theme.layout.spacing.sm },
});
