import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import theme from '../../theme';

export function AppFooter() {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>
                Created by Global IT & Business Solutions (Pty) Ltd.
            </Text>
            <Text style={styles.subtext}>
                Simplifying digital complexity for communities.
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderTopColor: theme.colors.structural.border,
        borderTopWidth: 1,
        marginTop: theme.layout.spacing.xxl,
        paddingTop: theme.layout.spacing.lg,
    },
    text: {
        ...theme.typography.caption,
        color: theme.colors.structural.slate,
        textAlign: 'center',
    },
    subtext: {
        ...theme.typography.caption,
        color: theme.colors.structural.slateMuted,
        marginTop: theme.layout.spacing.xs,
        textAlign: 'center',
    },
});
