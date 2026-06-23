import React from 'react';
import { StyleSheet, Text } from 'react-native';
import theme from '../../theme';
import { TruthCard } from '../ui/TruthCard';

export interface ProvisionalHypothesisSurfaceProps {
    intentHypothesis: string;
    suggestedCaption: string;
    suggestedCta: string;
}

export const ProvisionalHypothesisSurface: React.FC<ProvisionalHypothesisSurfaceProps> = ({
    intentHypothesis,
    suggestedCaption,
    suggestedCta,
}) => (
    <TruthCard style={{ marginBottom: theme.layout.spacing.xxxl }}>
        <Text style={styles.sectionTitle}>Provisional Hypothesis</Text>
        <Text style={styles.hypothesisText}>{intentHypothesis}</Text>

        <Text style={styles.sectionTitleSub}>Provisional Caption</Text>
        <Text style={styles.provisionalText}>{suggestedCaption}</Text>

        <Text style={styles.sectionTitleSub}>Provisional CTA</Text>
        <Text style={styles.provisionalText}>{suggestedCta}</Text>
    </TruthCard>
);

const styles = StyleSheet.create({
    sectionTitle: {
        ...theme.typography.heading,
        color: theme.colors.structural.charcoalLight,
        marginBottom: theme.layout.spacing.sm,
    },
    sectionTitleSub: {
        ...theme.typography.bodyStrong,
        color: theme.colors.structural.slate,
        marginTop: theme.layout.spacing.lg,
        marginBottom: theme.layout.spacing.xs,
    },
    hypothesisText: {
        ...theme.typography.body,
        color: theme.colors.structural.charcoal,
        fontStyle: 'italic',
    },
    provisionalText: {
        ...theme.typography.body,
        color: theme.colors.structural.slate,
    },
});
