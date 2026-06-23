import React from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

const scriptureReflections = [
    {
        id: 1,
        scripture: 'Proverbs 16:3',
        theme: 'Commitment',
        reflection:
            'Commit your work to the Lord, and let every opportunity be stewarded with wisdom and integrity.',
    },
    {
        id: 2,
        scripture: 'Zechariah 4:6',
        theme: 'Grace-led work',
        reflection:
            'Not by might, nor by power, but by the Spirit of God.',
    },
];

const ScriptureReflectionsScreen: React.FC = () => {
    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
            <View style={styles.heroCard}>
                <Text style={styles.eyebrow}>Faith & Reflection</Text>

                <Text style={styles.title}>Scripture Reflections</Text>

                <Text style={styles.description}>
                    Preserve scripture-based encouragement, business wisdom, and faith-aligned reflections for daily stewardship.
                </Text>
            </View>

            <View style={styles.featureCard}>
                <Text style={styles.scriptureLabel}>Today&apos;s encouragement</Text>

                <Text style={styles.scriptureText}>
                    “Commit your work to the Lord, and your plans will be established.”
                </Text>

                <Text style={styles.scriptureReference}>Proverbs 16:3</Text>
            </View>

            <View style={styles.formCard}>
                <Text style={styles.sectionTitle}>New Scripture Reflection</Text>

                <TextInput
                    placeholder="Scripture reference"
                    placeholderTextColor="#9CA3AF"
                    style={styles.input}
                />

                <TextInput
                    placeholder="Theme"
                    placeholderTextColor="#9CA3AF"
                    style={styles.input}
                />

                <TextInput
                    placeholder="Write your reflection..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    textAlignVertical="top"
                    style={styles.textArea}
                />

                <Pressable style={styles.primaryButton}>
                    <Text style={styles.primaryButtonText}>Save Reflection</Text>
                </Pressable>
            </View>

            <View style={styles.listCard}>
                <Text style={styles.sectionTitle}>Saved Reflections</Text>

                {scriptureReflections.map((item) => (
                    <View key={item.id} style={styles.reflectionCard}>
                        <Text style={styles.itemReference}>{item.scripture}</Text>
                        <Text style={styles.itemTheme}>{item.theme}</Text>
                        <Text style={styles.itemReflection}>{item.reflection}</Text>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#F8FAF7' },
    content: { padding: 20, gap: 16 },
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
    description: { fontSize: 15, lineHeight: 22, color: '#4B5563' },
    featureCard: {
        backgroundColor: '#FFFBEB',
        borderRadius: 24,
        padding: 22,
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    scriptureLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: '#92400E',
        textTransform: 'uppercase',
        marginBottom: 10,
    },
    scriptureText: {
        fontSize: 18,
        lineHeight: 28,
        fontWeight: '700',
        color: '#78350F',
        marginBottom: 12,
    },
    scriptureReference: {
        fontSize: 14,
        fontWeight: '800',
        color: '#92400E',
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
    primaryButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
    listCard: {
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
    itemReference: {
        fontSize: 13,
        fontWeight: '800',
        color: '#92400E',
        marginBottom: 4,
    },
    itemTheme: {
        fontSize: 15,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 8,
    },
    itemReflection: { fontSize: 14, lineHeight: 22, color: '#4B5563' },
});

export default ScriptureReflectionsScreen;
