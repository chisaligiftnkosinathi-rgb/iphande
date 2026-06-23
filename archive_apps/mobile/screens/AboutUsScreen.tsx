import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppHeader } from '../components/ui/AppHeader';

const AboutUsScreen: React.FC = () => {
    return (
        <View style={{ flex: 1 }}>
            <AppHeader title="About Us" />
            <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
                <View style={styles.card}>
                    <Text style={styles.title}>Created by Global IT and Business Solutions (Pty) Ltd.</Text>
                    <Text style={styles.slogan}>Simplifying digital complexity for communities.</Text>
                    <Text style={styles.body}>
                        iPhande preserves continuity, visibility, stewardship, and replay. We believe that technology should serve people, protect dignity, and ensure that meaningful work is not lost to the noise of algorithms.
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
    title: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 8 },
    slogan: { fontSize: 16, fontStyle: 'italic', color: '#4B5563', marginBottom: 16 },
    body: { fontSize: 15, lineHeight: 24, color: '#374151' },
});

export default AboutUsScreen;
