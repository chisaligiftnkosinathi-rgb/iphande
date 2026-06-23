import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import theme from '../../theme';

import { ViewStyle } from 'react-native';

export interface ContinuityMetaProps {
    label: string;
    value: string | number | null | undefined;
    style?: ViewStyle;
}

export const ContinuityMeta: React.FC<ContinuityMetaProps> = ({ label, value, style }) => (
    <View style={[styles.metaBox, style]}>
        <Text style={styles.metaText}>{label}: {value != null ? value : ''}</Text>
    </View>
);

const styles = StyleSheet.create({
    metaBox: {
        backgroundColor: theme?.colors?.structural?.borderSoft || '#f3f4f6',
        borderRadius: theme?.layout?.radii?.sm || 6,
        padding: theme?.layout?.spacing?.md || 12,
        marginBottom: theme?.layout?.spacing?.sm || 8,
    },
    metaText: {
        color: theme?.colors?.structural?.charcoalLight || '#6b7280',
        fontSize: 12,
    },
});
