import React from 'react';
import { Pressable, PressableProps, StyleSheet, Text } from 'react-native';
import theme from '../../theme';

interface StewardButtonProps extends PressableProps {
    title: string;
    variant?: 'primary' | 'secondary' | 'ghost';
    style?: any;
    loading?: boolean;
}

export const StewardButton: React.FC<StewardButtonProps> = ({ title, variant = 'primary', style, loading, disabled, ...rest }) => (
    <Pressable style={[styles.base, styles[variant], style]} disabled={disabled || loading} {...rest}>
        <Text style={styles.text}>{loading ? 'Loading...' : title}</Text>
    </Pressable>
);

const styles = StyleSheet.create({
    base: {
        borderRadius: theme?.layout?.radii?.sm || 6,
        paddingVertical: 12,
        alignItems: 'center',
        marginBottom: 8,
    },
    primary: {
        backgroundColor: theme?.colors?.stewardship?.text || '#16a34a',
    },
    secondary: {
        backgroundColor: theme?.colors?.structural?.borderSoft || '#e5e7eb',
        borderWidth: 1,
        borderColor: theme?.colors?.structural?.border || '#d1d5db',
    },
    ghost: {
        backgroundColor: 'transparent',
    },
    text: {
        color: theme?.colors?.humanSpace?.surface || '#fff',
        fontWeight: 'bold',
    },
});
