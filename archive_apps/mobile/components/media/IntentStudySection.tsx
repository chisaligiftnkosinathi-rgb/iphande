import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import theme from '../../theme';
import { EvidenceGapCard } from '../ui/EvidenceGapCard';
import { TruthCard } from '../ui/TruthCard';

export interface IntentStudySectionProps {
    observations: string[];
    contextSourcesUsed: string[];
    contextGaps: string[];
}

export const IntentStudySection: React.FC<IntentStudySectionProps> = ({
    observations,
    contextSourcesUsed,
    contextGaps,
}) => (
    <View style={styles.container}>
        <TruthCard style={styles.section}>
            <Text style={styles.sectionTitle}>What we observed</Text>
            {observations.map((obs, idx) => (
                <Text key={idx} style={styles.listItem}>• {obs}</Text>
            ))}
        </TruthCard>
        <TruthCard style={styles.section}>
            <Text style={styles.sectionTitle}>What we know from your business</Text>
            {contextSourcesUsed.map((source, idx) => (
                <Text key={idx} style={styles.listItem}>• {source.replace('_', ' ')}</Text>
            ))}
        </TruthCard>
        <EvidenceGapCard
            gaps={contextGaps}
            style={{ marginBottom: theme.layout.spacing.xl }}
        />
    </View>
);

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    section: {
        marginBottom: theme.layout.spacing.xl,
    },
    sectionTitle: {
        ...theme.typography.heading,
        color: theme.colors.structural.charcoalLight,
        marginBottom: theme.layout.spacing.sm,
    },
    listItem: {
        ...theme.typography.body,
        color: theme.colors.structural.slate,
        marginBottom: theme.layout.spacing.xs,
    },
});
