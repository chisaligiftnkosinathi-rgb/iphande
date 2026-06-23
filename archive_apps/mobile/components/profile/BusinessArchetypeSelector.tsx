import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import theme from '../../theme';

import { BUSINESS_ARCHETYPES } from '../../data/businessArchetypes';

interface BusinessArchetypeSelectorProps {
    selectedArchetypeKey: string;
    onSelectArchetype: (key: string) => void;
}

export const BusinessArchetypeSelector: React.FC<BusinessArchetypeSelectorProps> = ({ selectedArchetypeKey, onSelectArchetype }) => {
    return (
        <View style={styles.chipRow}>
            {BUSINESS_ARCHETYPES.map(({ key, label }) => (
                <Pressable
                    key={key}
                    style={[styles.chip, selectedArchetypeKey === key && styles.selectedChip]}
                    onPress={() => onSelectArchetype(key)}
                >
                    <Text style={[styles.chipText, selectedArchetypeKey === key && styles.selectedChipText]}>{label}</Text>
                </Pressable>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.layout.spacing.md,
        marginBottom: theme.layout.spacing.xs,
    },
    chip: {
        backgroundColor: theme.colors.stewardship.bg,
        borderRadius: theme.layout.radii.pill,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: theme.colors.stewardship.border,
        marginBottom: theme.layout.spacing.xs,
    },
    chipText: {
        ...theme.typography.caption,
        color: theme.colors.stewardship.textDeep,
    },
    selectedChip: {
        backgroundColor: theme.colors.stewardship.text,
        borderColor: theme.colors.stewardship.textDeep,
    },
    selectedChipText: {
        color: theme.colors.humanSpace.surface,
        fontWeight: '900',
    },
});
