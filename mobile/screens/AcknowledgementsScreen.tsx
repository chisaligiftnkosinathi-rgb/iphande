import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppHeader } from '../components/ui/AppHeader';

const AcknowledgementsScreen: React.FC = () => {
    return (
        <View style={{ flex: 1 }}>
            <AppHeader title="Acknowledgements" />
            <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
                <View style={styles.card}>
                    <Text style={styles.body}>
                        We acknowledge and give thanks to God for the vision, strength, and grace to build.
                    </Text>
                    <Text style={styles.body}>
                        To our families, whose support makes this work possible.
                    </Text>
                    <Text style={styles.body}>
                        To the community stewards, builders, and early users who trust us to preserve their continuity and dignity. Your stories shape this platform.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#F8FAF7' },
    content: { padding: 20, gap: 16 },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    body: { fontSize: 15, lineHeight: 24, color: '#374151', marginBottom: 16 },
});

export default AcknowledgementsScreen;
