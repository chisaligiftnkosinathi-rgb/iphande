import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { MusicPlayer } from '../components/media/MusicPlayer';
import { AppHeader } from '../components/ui/AppHeader';
import { MUSIC_TRACKS } from '../data/musicTracks';

const MusicScreen: React.FC = () => {
    return (
        <View style={{ flex: 1 }}>
            <AppHeader title="Music" />
            <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
                <View style={styles.card}>
                    <Text style={styles.title}>Inspirational Media</Text>
                    <Text style={styles.body}>
                        Music is provided for reflection and orientation. It is listened-only and remains governed media.
                    </Text>

                    {MUSIC_TRACKS.map((track) => (
                        <MusicPlayer key={track.id} track={track} />
                    ))}
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
    title: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 12 },
    body: { fontSize: 15, lineHeight: 24, color: '#374151', marginBottom: 12 },
});

export default MusicScreen;
