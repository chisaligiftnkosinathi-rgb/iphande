import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { buildApiUrl } from '../../config/api';
import { useSteward } from '../../context/StewardContext';

interface OpportunityItem {
    id: string;
    title: string;
    location_name: string;
    city: string;
    province: string;
    suburb: string;
    public_contact_whatsapp: string;
}

interface OpportunityGroup {
    archetype: string;
    items: OpportunityItem[];
}

export default function PublicOpportunitiesScreen() {
    const { isAuthenticated } = useSteward();
    const router = useRouter();
    const [groups, setGroups] = useState<OpportunityGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [province, setProvince] = useState('');
    const [city, setCity] = useState('');
    const [suburb, setSuburb] = useState('');

    useEffect(() => {
        fetchOpportunities();
    }, []);

    const fetchOpportunities = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (province) params.append('province', province);
            if (city) params.append('city', city);
            if (suburb) params.append('suburb', suburb);

            const response = await fetch(buildApiUrl(`public/opportunities?${params.toString()}`));
            if (!response.ok) throw new Error('Network response was not ok');

            const data = await response.json();
            setGroups(data.groups || []);
        } catch (error) {
            console.warn("Using demo opportunities because the API request failed:", error);
            setGroups([
                {
                    archetype: 'business_lead',
                    items: [
                        {
                            id: 'demo-1',
                            title: 'Mechanic service opportunity',
                            location_name: 'Mandla Auto Repairs',
                            city: 'Emalahleni',
                            province: 'Mpumalanga',
                            suburb: 'Klarinet',
                            public_contact_whatsapp: '27711603850',
                        },
                    ],
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleWhatsApp = (phone: string, title: string) => {
        if (!phone) return;
        const message = encodeURIComponent(`Hi, I am reaching out regarding the opportunity: ${title}`);
        Linking.openURL(`https://wa.me/${phone}?text=${message}`);
    };

    if (!isAuthenticated) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
                <Text style={[styles.header, { textAlign: 'center', marginBottom: 16 }]}>Please sign in to capture opportunities.</Text>
                <TouchableOpacity style={styles.authButton} onPress={() => router.push('/auth')}>
                    <Text style={styles.authButtonText}>Sign In as Steward</Text>
                </TouchableOpacity>
            </View>
        );
    }

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
                <ActivityIndicator size="large" color="#5D7A5A" style={{ marginTop: 40 }} />
            ) : groups.length === 0 ? (
                <Text style={styles.emptyText}>No opportunities found in this area.</Text>
            ) : (
                groups.map((group, idx) => (
                    <View key={idx} style={styles.groupContainer}>
                        <Text style={styles.groupHeader}>{group.archetype.replace('_', ' ').toUpperCase()}</Text>
                        {group.items.map((item) => (
                            <View key={item.id} style={styles.card}>
                                <Text style={styles.title}>{item.title}</Text>
                                <Text style={styles.location}>{item.location_name} � {item.suburb}, {item.city}, {item.province}</Text>
                                {item.public_contact_whatsapp ? (
                                    <TouchableOpacity style={styles.whatsappButton} onPress={() => handleWhatsApp(item.public_contact_whatsapp, item.title)}>
                                        <Text style={styles.whatsappButtonText}>?? Contact</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <Text style={styles.noContact}>No contact number provided</Text>
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
    container: { flex: 1, backgroundColor: '#F7F3EA' },
    contentContainer: { padding: 16, maxWidth: 800, alignSelf: 'center', width: '100%', paddingBottom: 60 },
    header: { fontSize: 28, fontWeight: 'bold', color: '#24352F', marginBottom: 4 },
    subHeader: { fontSize: 16, color: '#6F7D75', marginBottom: 20, fontStyle: 'italic' },
    filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
    input: { flex: 1, minWidth: 100, backgroundColor: '#FFFDF8', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E8DFD0' },
    searchButton: { backgroundColor: '#24352F', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, justifyContent: 'center' },
    searchButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    emptyText: { textAlign: 'center', fontSize: 16, color: '#888', marginTop: 40 },
    groupContainer: { marginBottom: 32 },
    groupHeader: { fontSize: 20, fontWeight: '700', color: '#24352F', marginBottom: 12, letterSpacing: 1 },
    card: { backgroundColor: '#FFFDF8', padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    title: { fontSize: 18, fontWeight: '600', color: '#24352F', marginBottom: 8 },
    location: { fontSize: 14, color: '#6F7D75', marginBottom: 16 },
    whatsappButton: { backgroundColor: '#25D366', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
    whatsappButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    noContact: { color: '#999', fontStyle: 'italic', fontSize: 14 },
    authButton: { backgroundColor: '#24352F', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, alignItems: 'center' },
    authButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
