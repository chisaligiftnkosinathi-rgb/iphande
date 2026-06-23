import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

// Fallback to localhost for local web development.
const API_BASE_URL = 'http://localhost:8000';

interface OpportunityItem {
    id: string;
    title: string;
    location_name: string | null;
    city: string | null;
    province: string | null;
    suburb: string | null;
    public_contact_whatsapp: string | null;
}

interface OpportunityGroup {
    archetype: string;
    items: OpportunityItem[];
}

interface PublicOpportunitiesResponse {
    province: string | null;
    city: string | null;
    suburb: string | null;
    groups: OpportunityGroup[];
}

export default function PublicOpportunitiesScreen() {
    const [groups, setGroups] = useState<OpportunityGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [province, setProvince] = useState('');
    const [city, setCity] = useState('');
    const [suburb, setSuburb] = useState('');

    const fetchOpportunities = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (province) params.append('province', province);
            if (city) params.append('city', city);
            if (suburb) params.append('suburb', suburb);

            const response = await fetch(`${API_BASE_URL}/public/opportunities?${params.toString()}`);
            if (!response.ok) throw new Error('Network response was not ok');

            const data: PublicOpportunitiesResponse = await response.json();
            setGroups(data.groups || []);
        } catch (error) {
            console.error("Failed to fetch opportunities:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOpportunities();
    }, []);

    const openWhatsApp = (phone: string, title: string) => {
        const message = encodeURIComponent(`Hi, I saw your opportunity for "${title}" on iPhande...`);
        Linking.openURL(`https://wa.me/${phone}?text=${message}`);
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <Text style={styles.header}>Discover Opportunities</Text>
            <Text style={styles.subHeader}>Connect directly with businesses near you.</Text>

            <View style={styles.filters}>
                <TextInput style={styles.input} placeholder="Province" value={province} onChangeText={setProvince} />
                <TextInput style={styles.input} placeholder="City" value={city} onChangeText={setCity} />
                <TextInput style={styles.input} placeholder="Suburb" value={suburb} onChangeText={setSuburb} />
                <TouchableOpacity style={styles.searchButton} onPress={fetchOpportunities}>
                    <Text style={styles.searchButtonText}>Search</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#4CAF50" style={{ marginTop: 40 }} />
            ) : groups.length === 0 ? (
                <Text style={styles.emptyText}>No opportunities found. Try adjusting your location.</Text>
            ) : (
                groups.map((group) => (
                    <View key={group.archetype} style={styles.groupContainer}>
                        <Text style={styles.groupHeader}>{group.archetype.replace(/_/g, ' ').toUpperCase()}</Text>
                        {group.items.map((item) => (
                            <View key={item.id} style={styles.card}>
                                <Text style={styles.title}>{item.title}</Text>
                                <Text style={styles.location}>
                                    📍 {[item.location_name, item.suburb, item.city, item.province].filter(Boolean).join(', ')}
                                </Text>

                                {item.public_contact_whatsapp ? (
                                    <TouchableOpacity
                                        style={styles.whatsappButton}
                                        onPress={() => openWhatsApp(item.public_contact_whatsapp!, item.title)}
                                    >
                                        <Text style={styles.whatsappButtonText}>💬 Chat on WhatsApp</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <Text style={styles.noContact}>No direct contact provided</Text>
                                )}
                            </View>
                        ))}
                    </View>
                ))
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9f9f9' },
    contentContainer: { padding: 16, maxWidth: 800, alignSelf: 'center', width: '100%' },
    header: { fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 4 },
    subHeader: { fontSize: 16, color: '#666', marginBottom: 20 },
    filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
    input: { flex: 1, minWidth: 100, backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
    searchButton: { backgroundColor: '#333', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, justifyContent: 'center' },
    searchButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    emptyText: { textAlign: 'center', fontSize: 16, color: '#888', marginTop: 40 },
    groupContainer: { marginBottom: 32 },
    groupHeader: { fontSize: 20, fontWeight: '700', color: '#444', marginBottom: 12, letterSpacing: 1 },
    card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    title: { fontSize: 18, fontWeight: '600', color: '#222', marginBottom: 8 },
    location: { fontSize: 14, color: '#555', marginBottom: 16 },
    whatsappButton: { backgroundColor: '#25D366', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
    whatsappButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    noContact: { color: '#999', fontStyle: 'italic', fontSize: 14 }
});
