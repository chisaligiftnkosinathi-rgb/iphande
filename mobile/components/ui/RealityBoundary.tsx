import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import theme from '../../theme';

import { ViewStyle } from 'react-native';

export interface RealityBoundaryProps {
    title?: string;
    children: React.ReactNode;
    style?: ViewStyle;
}

export const RealityBoundary: React.FC<RealityBoundaryProps> = ({ title, children, style }) => (
    <View style={[styles.boundary, style]}>
        {title ? <Text style={styles.text}>{title}</Text> : null}
        <Text style={styles.text}>{children}</Text>
    </View>
);

const styles = StyleSheet.create({
    boundary: {
        backgroundColor: theme?.colors?.reality?.bg || '#f0f0f0',
        borderWidth: 1,
        borderColor: theme?.colors?.reality?.border || '#ccc',
        borderRadius: theme?.layout?.radii?.md || 8,
        padding: theme?.layout?.spacing?.lg || 16,
        marginBottom: theme?.layout?.spacing?.md || 12,
    },
    text: {
        color: theme?.colors?.reality?.text || '#333',
    },
});
