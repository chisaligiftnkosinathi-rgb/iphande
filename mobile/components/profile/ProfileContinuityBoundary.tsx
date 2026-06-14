import React from 'react';

import { StyleSheet, Text, View } from 'react-native';

export const ProfileContinuityBoundary: React.FC = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Profile Continuity Boundary</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginVertical: 8,
    },
    text: {
        fontSize: 14,
        color: '#333',
    },
});
