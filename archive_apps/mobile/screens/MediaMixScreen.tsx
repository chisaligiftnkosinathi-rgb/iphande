import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppHeader } from '../components/ui/AppHeader';
import { MUSIC_TRACKS } from '../data/musicTracks';

export const MediaMixScreen: React.FC = () => {
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [selectedSongId, setSelectedSongId] = useState<string | null>(null);
    const [caption, setCaption] = useState('');

    const handleChooseImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
            Alert.alert('Permission required', 'You need to allow access to your photos to pick an image.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 1,
        });

        if (!result.cancelled) {
            setImageUri((result as any).uri);
        }
    };

    const handlePreviewPayload = () => {
        const song = MUSIC_TRACKS.find(t => t.id === selectedSongId);
        const payload = `Media Mix Payload Preview:\n\nImage: ${imageUri ? 'Selected' : 'None'}\nSong: ${song ? song.title : 'None'}\nCaption: ${caption}`;
        Alert.alert('Preview Share Payload', payload);
    };

    const handleShare = async () => {
        try {
            const song = MUSIC_TRACKS.find(t => t.id === selectedSongId);
            const shareMessage = `${caption}\n\n🎵 Associated Song: ${song ? song.title : 'None'}`;

            await Share.share({
                message: shareMessage,
                // Note: URL sharing support varies by platform in native Share (particularly Android vs iOS implementations),
                // so the text payload carries the context for V1.
                // url: imageUri || undefined,
            });
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Unable to share at this time.');
        }
    };

    return (
        <View style={{ flex: 1 }}>
            <AppHeader title="Media Mix" />
            <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
                <View style={styles.heroCard}>
                    <Text style={styles.title}>Media Mix Studio</Text>
                    <Text style={styles.description}>
                        Combine images with continuity music and truthful captions to share your story.
                    </Text>
                </View>

                <View style={styles.boundaryCard}>
                    <Text style={styles.boundaryTitle}>V1.1 Pending</Text>
                    <Text style={styles.boundaryText}>
                        Audio/video merge and true video export is pending V1.1. Currently, songs are associated via text context when sharing to social platforms.
                    </Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>1. Choose Image</Text>
                    {imageUri ? (
                        <Image source={{ uri: imageUri }} style={styles.previewImage} />
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <Text style={styles.imagePlaceholderText}>No image selected</Text>
                        </View>
                    )}
                    <Pressable style={styles.buttonSecondary} onPress={handleChooseImage}>
                        <Text style={styles.buttonSecondaryText}>{imageUri ? 'Change Image' : 'Select Image'}</Text>
                    </Pressable>
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>2. Choose Song Association</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.songList}>
                        {MUSIC_TRACKS.map(track => (
                            <Pressable
                                key={track.id}
                                style={[styles.songChip, selectedSongId === track.id && styles.songChipSelected]}
                                onPress={() => setSelectedSongId(track.id)}
                            >
                                <Text style={[styles.songChipText, selectedSongId === track.id && styles.songChipTextSelected]}>
                                    {track.title}
                                </Text>
                            </Pressable>
                        ))}
                    </ScrollView>
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>3. Write Caption</Text>
                    <TextInput
                        style={styles.textArea}
                        placeholder="Share the story behind this moment..."
                        placeholderTextColor="#9CA3AF"
                        multiline
                        value={caption}
                        onChangeText={setCaption}
                    />
                </View>

                <View style={styles.actionCard}>
                    <Pressable style={styles.buttonSecondary} onPress={handlePreviewPayload}>
                        <Text style={styles.buttonSecondaryText}>Preview Share Payload</Text>
                    </Pressable>
                    <Pressable style={styles.buttonPrimary} onPress={handleShare}>
                        <Text style={styles.buttonPrimaryText}>Share (Native)</Text>
                    </Pressable>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#F8FAF7'
    },
    content: {
        padding: 20,
        gap: 16
    },
    heroCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    title: { fontSize: 24, fontWeight: '900', color: '#102A20', marginBottom: 8 },
    description: { fontSize: 15, lineHeight: 22, color: '#4B5563' },
    boundaryCard: {
        backgroundColor: '#FEF3C7',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    boundaryTitle: { fontSize: 14, fontWeight: '800', color: '#92400E', marginBottom: 6 },
    boundaryText: { fontSize: 13, lineHeight: 20, color: '#78350F' },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    actionCard: {
        gap: 12,
        marginBottom: 30,
    },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 12 },
    previewImage: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        marginBottom: 12,
    },
    imagePlaceholder: {
        width: '100%',
        height: 120,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderStyle: 'dashed',
    },
    imagePlaceholderText: { color: '#9CA3AF', fontSize: 14 },
    songList: { flexDirection: 'row' },
    songChip: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },
    songChipSelected: {
        backgroundColor: '#1E3A2F',
        borderColor: '#1E3A2F',
    },
    songChipText: { fontSize: 13, fontWeight: '700', color: '#374151' },
    songChipTextSelected: { color: '#FFFFFF' },
    textArea: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 12,
        padding: 16,
        fontSize: 15,
        color: '#111827',
        minHeight: 100,
        textAlignVertical: 'top',
    },
    buttonPrimary: { backgroundColor: '#1E3A2F', padding: 16, borderRadius: 12, alignItems: 'center' },
    buttonPrimaryText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
    buttonSecondary: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#D1D5DB' },
    buttonSecondaryText: { color: '#1E3A2F', fontWeight: '800', fontSize: 15 },
});

export default MediaMixScreen;
