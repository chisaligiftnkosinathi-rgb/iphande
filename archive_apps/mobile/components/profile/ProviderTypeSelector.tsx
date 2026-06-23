import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import theme from '../../theme';

const PROVIDER_TYPES = [
    'Individual',
    'Small Business',
    'Church',
    'Community Group',
];

interface ProviderTypeSelectorProps {
    selectedProviderType: string;
    onSelectProviderType: (value: string) => void;
}

export const ProviderTypeSelector: React.FC<ProviderTypeSelectorProps> = ({ selectedProviderType, onSelectProviderType }) => {
    return (
        <View style={styles.chipRow}>
            {PROVIDER_TYPES.map((type) => (
                <Pressable
                    key={type}
                    style={[styles.chip, selectedProviderType === type && styles.selectedChip]}
                    onPress={() => onSelectProviderType(type)}
                >
                    <Text style={[styles.chipText, selectedProviderType === type && styles.selectedChipText]}>{type}</Text>
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
