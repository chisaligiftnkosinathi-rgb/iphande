import React from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

const mediaItems = [
    {
        id: 1,
        name: 'Business Banner.jpg',
        type: 'Image',
        size: '2.4 MB',
    },
    {
        id: 2,
        name: 'Campaign Video.mp4',
        type: 'Video',
        size: '18.1 MB',
    },
    {
        id: 3,
        name: 'Community Flyer.pdf',
        type: 'Document',
        size: '1.1 MB',
    },
];

const MediaScreen: React.FC = () => {
    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
            <View style={styles.heroCard}>
                <Text style={styles.eyebrow}>Digital Assets</Text>

                <Text style={styles.title}>Media Library</Text>

                <Text style={styles.description}>
                    Store and manage business media, campaign visuals, documents, and community promotional assets.
                </Text>
            </View>

            <View style={styles.actionCard}>
                <Pressable style={styles.uploadButton}>
                    <Text style={styles.uploadButtonText}>Upload Media</Text>
                </Pressable>

                <Text style={styles.uploadNote}>
                    Images, videos, and documents linked to opportunities and campaigns will appear here.
                </Text>
            </View>

            <View style={styles.libraryCard}>
                <Text style={styles.sectionTitle}>Recent Media</Text>

                {mediaItems.map((item) => (
                    <View key={item.id} style={styles.mediaItem}>
                        <View style={styles.mediaIcon}>
                            <Text style={styles.mediaIconText}>
                                {item.type.charAt(0)}
                            </Text>
                        </View>

                        <View style={styles.mediaInfo}>
                            <Text style={styles.mediaName}>{item.name}</Text>

                            <Text style={styles.mediaMeta}>
                                {item.type} • {item.size}
                            </Text>
                        </View>
                    </View>
                ))}
            </View>

            <View style={styles.boundaryCard}>
                <Text style={styles.boundaryTitle}>Media governance</Text>

                <Text style={styles.boundaryText}>
                    Uploaded media should preserve ownership visibility, upload lineage, and truthful association with campaigns and opportunities.
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
        borderRadius: 28,
        padding: 22,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#102A20',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    eyebrow: {
        fontSize: 13,
        fontWeight: '700',
        color: '#3E6B57',
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 8,
    },
    title: {
        fontSize: 48,
        fontWeight: '900',
        color: '#102A20',
        letterSpacing: -1.5,
        marginBottom: 8,
    },
    description: {
        fontSize: 17,
        lineHeight: 30,
        color: '#4B5563',
    },
    uploadButton: {
        backgroundColor: '#1E3A2F',
        borderRadius: 16,
        paddingVertical: 14,
        alignItems: 'center',
        marginBottom: 8,
    },
    uploadButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
    },
    uploadNote: {
        color: '#4B5563',
        fontSize: 13,
        marginBottom: 8,
        textAlign: 'center',
    },
    actionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 28,
        padding: 22,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        alignItems: 'center',
        shadowColor: '#102A20',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    // ...existing code...
    libraryCard: {
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
    mediaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 18,
        padding: 14,
        marginBottom: 12,
    },
    mediaIcon: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: '#D1FAE5',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    mediaIconText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#065F46',
    },
    mediaInfo: {
        flex: 1,
    },
    mediaName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    mediaMeta: {
        fontSize: 13,
        color: '#6B7280',
    },
    boundaryCard: {
        backgroundColor: '#F3F4F6',
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },
    boundaryTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 8,
    },
    boundaryText: {
        fontSize: 13,
        lineHeight: 20,
        color: '#4B5563',
    },
});

export default MediaScreen;
