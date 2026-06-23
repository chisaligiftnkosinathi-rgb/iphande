import React from 'react';

export interface StewardProfileActionsProps {
    onSave: () => void;
    isSaving?: boolean;
}

import { Pressable, StyleSheet, Text, View } from 'react-native';

export const StewardProfileActions: React.FC<StewardProfileActionsProps> = ({ onSave, isSaving }) => {
    return (
        <View style={styles.container}>
            <Pressable
                style={({ pressed }) => [
                    styles.button,
                    isSaving && styles.buttonDisabled,
                    pressed && !isSaving && styles.buttonPressed,
                ]}
                onPress={onSave}
                disabled={isSaving}
            >
                <Text style={styles.buttonText}>{isSaving ? 'Saving...' : 'Save'}</Text>
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginVertical: 12,
    },
    button: {
        backgroundColor: '#2e7d32',
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 24,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    buttonDisabled: {
        backgroundColor: '#aaa',
    },
    buttonPressed: {
        opacity: 0.8,
    },
});
