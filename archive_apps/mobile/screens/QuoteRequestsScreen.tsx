import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const QuoteRequestsScreen: React.FC = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.header}>Quote Requests (Placeholder)</Text>
            <Text style={styles.text}>This screen will show quote requests for the business owner.</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAF7' },
    header: { fontSize: 28, fontWeight: '900', color: '#102A20', marginBottom: 18 },
    text: { fontSize: 16, color: '#4B5563' },
});

export default QuoteRequestsScreen;
