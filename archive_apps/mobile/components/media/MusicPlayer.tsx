import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MusicTrack } from '../../data/musicTracks';

interface Props {
    track: MusicTrack;
}

export const MusicPlayer: React.FC<Props> = ({ track }) => {
    const [isPlaying, setIsPlaying] = useState(false);

    const handlePlayPause = () => {
        setIsPlaying(!isPlaying);
        if (!isPlaying) {
            console.log(`[MusicPlayer] Simulating play for: ${track.title}`);
        } else {
            console.log(`[MusicPlayer] Simulating pause for: ${track.title}`);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.info}>
                <Text style={styles.title}>{track.title}</Text>
                <Text style={styles.caption}>{track.caption}</Text>
                <Text style={styles.description}>{track.description}</Text>
                <View style={styles.metaRow}>
                    {track.album && <Text style={styles.metaBadge}>{track.album.toUpperCase()}</Text>}
                    <Text style={styles.metaBadge}>{track.usage.replace('_', ' ').toUpperCase()}</Text>
                    <Text style={styles.metaBadge}>{track.origin.replace('_', ' ').toUpperCase()}</Text>
                    {track.duration && <Text style={styles.metaBadge}>{track.duration}</Text>}
                </View>
                {track.replayTags && track.replayTags.length > 0 && (
                    <View style={styles.tagsRow}>
                        {track.replayTags.map(tag => (
                            <Text key={tag} style={styles.tagBadge}>#{tag}</Text>
                        ))}
                    </View>
                )}
            </View>
            <Pressable
                style={[styles.playButton, isPlaying && styles.playingButton]}
                onPress={handlePlayPause}
            >
                <Ionicons name={isPlaying ? "pause" : "play"} size={22} color="#FFF" />
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        alignItems: 'center',
    },
    info: { flex: 1, marginRight: 16 },
    title: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 2 },
    caption: { fontSize: 12, fontWeight: '700', color: '#2F6B4F', fontStyle: 'italic', marginBottom: 4 },
    description: { fontSize: 13, lineHeight: 20, color: '#4B5563', marginBottom: 8 },
    metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
    metaBadge: {
        fontSize: 10, fontWeight: '700', color: '#374151', backgroundColor: '#E5E7EB',
        paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4,
    },
    tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    tagBadge: {
        fontSize: 10, fontWeight: '700', color: '#10B981', backgroundColor: '#ECFDF5',
        paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4,
    },
    playButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center' },
    playingButton: { backgroundColor: '#1E3A2F' },
});
