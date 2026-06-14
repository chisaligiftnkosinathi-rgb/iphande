import React from 'react';

export interface BusinessIdentityCardProps {
    displayName: string;
    avatarUrl?: string | null;
}

import { Image, StyleSheet, Text, View } from 'react-native';

export const BusinessIdentityCard: React.FC<BusinessIdentityCardProps> = ({ displayName, avatarUrl }) => {
    return (
        <View style={styles.card}>
            <Text style={styles.displayName}>Display Name: {displayName}</Text>
            {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        alignItems: 'center',
        marginBottom: 16,
    },
    displayName: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#eee',
    },
});
