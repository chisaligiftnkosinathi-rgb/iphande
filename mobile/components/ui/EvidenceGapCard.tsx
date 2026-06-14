import React from 'react';
import { StyleSheet, Text, View, ViewProps } from 'react-native';
import theme from '../../theme';

interface EvidenceGapCardProps extends ViewProps {
    gaps: string[];
    style?: any;
}

export const EvidenceGapCard: React.FC<EvidenceGapCardProps> = ({ gaps, style, ...rest }) => (
    <View style={[styles.card, style]} {...rest}>
        <Text style={styles.title}>Evidence Gaps</Text>
        {gaps && gaps.length > 0 ? (
            gaps.map((gap, idx) => (
                <Text key={idx} style={styles.gapText}>• {gap}</Text>
            ))
        ) : (
            <Text style={styles.gapText}>No evidence gaps identified.</Text>
        )}
    </View>
);

const styles = StyleSheet.create({
    card: {
        backgroundColor: theme?.colors?.evidence?.bg || '#fffbe6',
        borderRadius: theme?.layout?.radii?.md || 8,
        padding: theme?.layout?.spacing?.lg || 16,
        borderWidth: 1,
        borderColor: theme?.colors?.evidence?.border || '#ffe58f',
        marginBottom: theme?.layout?.spacing?.md || 12,
    },
    title: {
        fontWeight: 'bold',
        marginBottom: 8,
        color: theme?.colors?.evidence?.textDeep || '#ad6800',
    },
    gapText: {
        color: theme?.colors?.evidence?.textDeep || '#ad6800',
        marginBottom: 4,
    },
});
