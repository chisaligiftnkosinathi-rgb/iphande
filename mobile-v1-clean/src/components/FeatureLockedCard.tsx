import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

interface FeatureLockedCardProps {
    featureName: string;
    description: string;
    packName: string;
}

export function FeatureLockedCard({ featureName, description, packName }: FeatureLockedCardProps) {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <View style={styles.lockIconContainer}>
                <Text style={styles.lockIcon}>🔒</Text>
            </View>
            <Text style={styles.title}>{featureName} Locked</Text>
            <Text style={styles.description}>
                {description}
            </Text>
            <TouchableOpacity 
                style={styles.button} 
                onPress={() => router.push({ pathname: '/upgrade', params: { feature: featureName, pack: packName } })}
            >
                <Text style={styles.buttonText}>Unlock {packName}</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#1a1a1a',
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
        marginVertical: 20,
        borderWidth: 1,
        borderColor: '#333',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    lockIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    lockIcon: {
        fontSize: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
        textAlign: 'center',
    },
    description: {
        fontSize: 15,
        color: '#aaa',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    button: {
        backgroundColor: '#ffb900',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 8,
        width: '100%',
    },
    buttonText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 16,
        textAlign: 'center',
    },
});
