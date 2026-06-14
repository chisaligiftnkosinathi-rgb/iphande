import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import theme from '../../theme';

interface TruthCardProps extends ViewProps {
    children: React.ReactNode;
    style?: any;
}

export const TruthCard: React.FC<TruthCardProps> = ({ children, style, ...rest }) => (
    <View style={[styles.card, style]} {...rest}>
        {children}
    </View>
);

const styles = StyleSheet.create({
    card: {
        backgroundColor: theme?.colors?.humanSpace?.surface || '#fff',
        borderRadius: theme?.layout?.radii?.md || 8,
        padding: theme?.layout?.spacing?.lg || 16,
        marginBottom: theme?.layout?.spacing?.md || 12,
        borderWidth: 1,
        borderColor: theme?.colors?.structural?.border || '#eee',
    },
});
