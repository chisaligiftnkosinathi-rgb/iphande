import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { navigateTo } from '../navigation';

type MessageTemplate = {
    id: number;
    category: string;
    title: string;
    message: string;
};

const templates: MessageTemplate[] = [
    {
        id: 1,
        category: 'Client Outreach',
        title: 'Welcome Message',
        message:
            'Thank you for connecting with us. We look forward to supporting your business journey.',
    },
    {
        id: 2,
        category: 'Campaign Follow-up',
        title: 'Participation Reminder',
        message:
            'This is a friendly reminder regarding the upcoming campaign activity and community engagement session.',
    },
    {
        id: 3,
        category: 'Opportunities',
        title: 'Opportunity Notification',
        message:
            'A new opportunity aligned with your interests has been identified.',
    },
];

const MessageTemplatesScreen: React.FC = () => {
    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
            <View style={styles.heroCard}>
                <View style={styles.heroIcon}>
                    <Ionicons name="document-text-outline" size={28} color="#1E3A2F" />
                </View>

                <Text style={styles.eyebrow}>Communication Assets</Text>
                <Text style={styles.title}>Message Templates</Text>

                <Text style={styles.description}>
                    Create reusable communication templates for campaigns, outreach,
                    follow-ups, and opportunity notifications.
                </Text>
            </View>

            <View style={styles.formCard}>
                <Text style={styles.sectionTitle}>Create Template</Text>

                <TextInput
                    placeholder="Template title"
                    placeholderTextColor="#9CA3AF"
                    style={styles.input}
                    autoCapitalize="words"
                />

                <TextInput
                    placeholder="Category"
                    placeholderTextColor="#9CA3AF"
                    style={styles.input}
                    autoCapitalize="words"
                />

                <TextInput
                    placeholder="Write template message..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    textAlignVertical="top"
                    style={styles.textArea}
                />

                <View style={styles.buttonRow}>
                    <Pressable style={styles.primaryButton}>
                        <Ionicons name="save-outline" size={18} color="#FFFFFF" />
                        <Text style={styles.primaryButtonText}>Save</Text>
                    </Pressable>

                    <Pressable style={styles.secondaryButton} onPress={() => navigateTo('ContentGenerator')}>
                        <Ionicons name="flash-outline" size={18} color="#1E3A2F" />
                        <Text style={styles.secondaryButtonText}>Generate</Text>
                    </Pressable>
                </View>
            </View>

            <View style={styles.templatesCard}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Saved Templates</Text>

                    <Pressable onPress={() => navigateTo('Campaigns')}>
                        <Text style={styles.linkText}>Campaigns</Text>
                    </Pressable>
                </View>

                {templates.map((template) => (
                    <View key={template.id} style={styles.templateCard}>
                        <View style={styles.templateHeader}>
                            <View style={styles.templateIcon}>
                                <Ionicons name="chatbox-ellipses-outline" size={20} color="#1E3A2F" />
                            </View>

                            <View style={styles.templateMeta}>
                                <Text style={styles.templateCategory}>{template.category}</Text>
                                <Text style={styles.templateTitle}>{template.title}</Text>
                            </View>
                        </View>

                        <Text style={styles.templateMessage}>{template.message}</Text>
                    </View>
                ))}
            </View>

            <View style={styles.boundaryCard}>
                <Ionicons name="shield-checkmark-outline" size={22} color="#3730A3" />

                <View style={styles.boundaryContent}>
                    <Text style={styles.boundaryTitle}>Communication integrity</Text>

                    <Text style={styles.boundaryText}>
                        Templates should preserve truthful communication patterns and remain
                        clearly attributable to their intended outreach context.
                    </Text>
                </View>
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
    heroIcon: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: '#D1FAE5',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
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
    formCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 16,
    },
    linkText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#1E3A2F',
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
    buttonRow: { flexDirection: 'row', gap: 12 },
    primaryButton: {
        flex: 1,
        backgroundColor: '#1E3A2F',
        borderRadius: 16,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    primaryButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
    secondaryButton: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 16,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    secondaryButtonText: { color: '#1E3A2F', fontWeight: '700', fontSize: 14 },
    templatesCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    templateCard: {
        backgroundColor: '#F9FAFB',
        borderRadius: 18,
        padding: 16,
        marginBottom: 14,
    },
    templateHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    templateIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#D1FAE5',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    templateMeta: { flex: 1 },
    templateCategory: {
        fontSize: 12,
        fontWeight: '800',
        color: '#2F6B4F',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    templateTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#111827',
    },
    templateMessage: { fontSize: 14, lineHeight: 22, color: '#4B5563' },
    boundaryCard: {
        flexDirection: 'row',
        gap: 12,
        backgroundColor: '#EEF2FF',
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        borderColor: '#C7D2FE',
    },
    boundaryContent: { flex: 1 },
    boundaryTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#3730A3',
        marginBottom: 8,
    },
    boundaryText: { fontSize: 13, lineHeight: 20, color: '#4338CA' },
});

export default MessageTemplatesScreen;
