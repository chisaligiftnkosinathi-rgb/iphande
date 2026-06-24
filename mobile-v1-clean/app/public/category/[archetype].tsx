import { useEffect, useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { fetchArchetypeProfiles } from "../../../src/api/publicProfileApi";

export default function ArchetypeProfilesScreen() {
    const { archetype } = useLocalSearchParams();
    const router = useRouter();

    const [profiles, setProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetchArchetypeProfiles(archetype as string);
                setProfiles(res.results || []);
            } catch (err) {
                console.error("Failed to fetch archetype profiles", err);
            } finally {
                setLoading(false);
            }
        };

        if (archetype) {
            load();
        }
    }, [archetype]);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Profiles for {String(archetype).replace(/_/g, ' ').toUpperCase()}</Text>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#111827" style={{ marginTop: 40 }} />
            ) : profiles.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No stewards found for this category.</Text>
                </View>
            ) : (
                <FlatList
                    contentContainerStyle={styles.list}
                    data={profiles}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <Pressable 
                            style={styles.card}
                            onPress={() => router.push(`/public/${item.slug}`)}
                        >
                            <Text style={styles.name}>{item.name}</Text>
                            <Text style={styles.location}>📍 {item.location || 'Location not specified'}</Text>
                            {item.short_bio && <Text style={styles.bio} numberOfLines={2}>{item.short_bio}</Text>}
                        </Pressable>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: { padding: 24, paddingTop: 60, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderColor: '#F3F4F6' },
    title: { fontSize: 22, fontWeight: '800', color: '#111827' },
    list: { padding: 24, gap: 16 },
    card: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 16,
    },
    name: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 4 },
    location: { fontSize: 14, color: '#4B5563', marginBottom: 8 },
    bio: { fontSize: 14, color: '#6B7280', lineHeight: 20 },
    emptyState: { alignItems: 'center', marginTop: 40 },
    emptyText: { color: '#6B7280', fontSize: 16 }
});
