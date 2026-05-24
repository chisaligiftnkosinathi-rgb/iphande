import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const GivingSupportScreen: React.FC = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.header}>Giving & Support (Coming Soon)</Text>
            <Text style={styles.text}>This screen will allow voluntary giving and support after value is delivered.</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAF7' },
    header: { fontSize: 28, fontWeight: '900', color: '#102A20', marginBottom: 18 },
    text: { fontSize: 16, color: '#4B5563' },
});

export default GivingSupportScreen;
