import React from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

const reflections = [
    {
        id: 1,
        title: 'Community outreach reflection',
        date: '22 May 2026',
        content:
            'Observed stronger engagement when opportunities were presented with clear local impact.',
    },
    {
        id: 2,
        title: 'Campaign follow-up insight',
        date: '20 May 2026',
        content:
            'Consistency in communication improved response quality and participation.',
    },
];

const ReflectionsScreen: React.FC = () => {
    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
            <View style={styles.heroCard}>
                <Text style={styles.eyebrow}>Observational Journal</Text>

                <Text style={styles.title}>Reflections</Text>

                <Text style={styles.description}>
                    Preserve insights, lessons learned, operational observations, and meaningful moments connected to opportunities and campaigns.
                </Text>
            </View>

            <View style={styles.formCard}>
                <Text style={styles.sectionTitle}>New Reflection</Text>

                <TextInput
                    placeholder="Reflection title"
                    placeholderTextColor="#9CA3AF"
                    style={styles.input}
                />

                <TextInput
                    placeholder="Write your reflection here..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    textAlignVertical="top"
                    style={styles.textArea}
                />

                <Pressable style={styles.primaryButton}>
                    <Text style={styles.primaryButtonText}>
                        Save Reflection
                    </Text>
                </Pressable>
            </View>

            <View style={styles.timelineCard}>
                <Text style={styles.sectionTitle}>Recent Reflections</Text>

                {reflections.map((reflection) => (
                    <View key={reflection.id} style={styles.reflectionCard}>
                        <View style={styles.reflectionHeader}>
                            <Text style={styles.reflectionTitle}>
                                {reflection.title}
                            </Text>

                            <Text style={styles.reflectionDate}>
                                {reflection.date}
                            </Text>
                        </View>

                        <Text style={styles.reflectionContent}>
                            {reflection.content}
                        </Text>
                    </View>
                ))}
            </View>

            <View style={styles.boundaryCard}>
                <Text style={styles.boundaryTitle}>
                    Reflection continuity
                </Text>

                <Text style={styles.boundaryText}>
                    Reflections should preserve context and history without silently rewriting prior observations or associated activity.
                </Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#F8FAF7',
    },
    content: {
        padding: 20,
        gap: 16,
    },
    heroCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    eyebrow: {
        fontSize: 12,
        fontWeight: '700',
        color: '#2F6B4F',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#102A20',
        marginBottom: 8,
    },
    description: {
        fontSize: 15,
        lineHeight: 22,
        color: '#4B5563',
    },
    formCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 16,
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 14,
        color: '#111827',
        marginBottom: 14,
    },
    textArea: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 14,
        color: '#111827',
        minHeight: 120,
        marginBottom: 16,
    },
    primaryButton: {
        backgroundColor: '#1E3A2F',
        borderRadius: 16,
        paddingVertical: 14,
        alignItems: 'center',
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
    },
    timelineCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    reflectionCard: {
        backgroundColor: '#F9FAFB',
        borderRadius: 18,
        padding: 16,
        marginBottom: 14,
    },
    reflectionHeader: {
        marginBottom: 10,
    },
    reflectionTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 4,
    },
    reflectionDate: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '600',
    },
    reflectionContent: {
        fontSize: 14,
        lineHeight: 22,
        color: '#4B5563',
    },
    boundaryCard: {
        backgroundColor: '#ECFEFF',
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        borderColor: '#A5F3FC',
    },
    boundaryTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#155E75',
        marginBottom: 8,
    },
    boundaryText: {
        fontSize: 13,
        lineHeight: 20,
        color: '#0F766E',
    },
});

export default ReflectionsScreen;
