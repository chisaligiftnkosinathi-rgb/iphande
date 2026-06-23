import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LocationPicker, LocationSelection } from '../../src/components/LocationPicker';
import { API_BASE_URL } from '../../src/config/api';
import { calculateDistanceKm } from '../../src/lib/location';

type OpportunityGroup = {
    archetype: string;
    items: {
        id: string;
        title: string;
        location_name: string;
        city: string;
        province: string;
        suburb: string;
        latitude?: number | null;
        longitude?: number | null;
        public_contact_whatsapp: string;
    }[];
};

export default function ExploreScreen() {
    const router = useRouter();
    const [groups, setGroups] = useState<OpportunityGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [userLat, setUserLat] = useState<number | null>(null);
    const [userLon, setUserLon] = useState<number | null>(null);
    const [locationLoading, setLocationLoading] = useState(false);

    const [locationFilter, setLocationFilter] = useState<LocationSelection | null>(null);
    const [showPicker, setShowPicker] = useState(false);

    useEffect(() => {
        const fetchOpportunities = async () => {
            setLoading(true);
            try {
                const url = locationFilter ? `${API_BASE_URL}/public/opportunities?place_code=${locationFilter.place_code}` : `${API_BASE_URL}/public/opportunities`;
                const res = await fetch(url);
                if (!res.ok) throw new Error('Failed to fetch opportunities');
                const data = await res.json();
                setGroups(data.groups || []);
            } catch (err) {
                console.error(err);
                setError('Could not load local services. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchOpportunities();
    }, [locationFilter]);

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Local Services</Text>
            </View>

            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                <View style={styles.hero}>
                    <Text style={styles.title}>Community Opportunities</Text>
                    <Text style={styles.subtitle}>Discover needs and services in your area.</Text>

                    <View style={styles.filtersRow}>
                        <TouchableOpacity style={styles.filterButton} onPress={() => setShowPicker(true)}>
                            <Ionicons name="map-outline" size={16} color="#111827" />
                            <Text style={styles.filterButtonText}>
                                {locationFilter ? `${locationFilter.main_place}` : 'Filter by Area'}
                            </Text>
                        </TouchableOpacity>

                        {locationFilter && (
                            <TouchableOpacity style={styles.clearFilterBtn} onPress={() => setLocationFilter(null)}>
                                <Ionicons name="close-circle" size={18} color="#6B7280" />
                            </TouchableOpacity>
                        )}

                        {!userLat && !userLon ? (
                            <TouchableOpacity style={styles.locationButton} onPress={async () => {
                                setLocationLoading(true);
                                try {
                                    let { status } = await Location.requestForegroundPermissionsAsync();
                                    if (status !== 'granted') {
                                        Alert.alert('Permission Denied', 'Permission to access location was denied.');
                                        setLocationLoading(false);
                                        return;
                                    }
                                    let loc = await Location.getCurrentPositionAsync({});
                                    setUserLat(loc.coords.latitude);
                                    setUserLon(loc.coords.longitude);
                                } catch (err) {
                                    Alert.alert('Error', 'Could not fetch location.');
                                } finally {
                                    setLocationLoading(false);
                                }
                            }} disabled={locationLoading}>
                                {locationLoading ? <ActivityIndicator size="small" color="#111827" /> : (
                                    <Text style={styles.locationButtonText}>Use GPS</Text>
                                )}
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.locationActive}>
                                <Ionicons name="checkmark-circle" size={16} color="#059669" />
                            </View>
                        )}
                    </View>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color="#111827" style={{ marginTop: 40 }} />
                ) : error ? (
                    <View style={styles.errorBox}>
                        <Ionicons name="alert-circle-outline" size={24} color="#991B1B" />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                ) : groups.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="search-outline" size={48} color="#D1D5DB" />
                        <Text style={styles.emptyText}>No public opportunities found right now.</Text>
                        <Text style={styles.emptySubtext}>Check back later or post one yourself!</Text>
                    </View>
                ) : (
                    groups.map((group, idx) => (
                        <View key={idx} style={styles.groupSection}>
                            <Text style={styles.groupHeader}>{group.archetype}</Text>
                            {group.items.map((item, i) => (
                                <View key={i} style={styles.card}>
                                    <Text style={styles.cardTitle}>{item.title}</Text>
                                    <View style={styles.metaRow}>
                                        <Ionicons name="location-outline" size={14} color="#6B7280" />
                                        <Text style={styles.metaText}>
                                            {item.city}, {item.province} {item.suburb ? `(${item.suburb})` : ''}
                                        </Text>
                                        {userLat && userLon && item.latitude && item.longitude ? (
                                            <>
                                                <Text style={styles.metaText}>•</Text>
                                                <Text style={styles.metaDistance}>{calculateDistanceKm(userLat, userLon, item.latitude, item.longitude)} km away</Text>
                                            </>
                                        ) : null}
                                    </View>
                                    {item.latitude && item.longitude && (
                                        <TouchableOpacity style={styles.mapsButton} onPress={() => Linking.openURL(`https://maps.google.com/?q=${item.latitude},${item.longitude}`)}>
                                            <Ionicons name="map-outline" size={16} color="#059669" />
                                            <Text style={styles.mapsButtonText}>Open in Maps</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ))}
                        </View>
                    ))
                )}
            </ScrollView>

            <LocationPicker
                visible={showPicker}
                onClose={() => setShowPicker(false)}
                onSelect={setLocationFilter}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backBtn: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    container: {
        flex: 1,
    },
    content: {
        padding: 24,
        paddingBottom: 60,
    },
    hero: {
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#4B5563',
        lineHeight: 24,
    },
    errorBox: {
        backgroundColor: '#FEE2E2',
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    errorText: {
        color: '#991B1B',
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 40,
        padding: 24,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 8,
    },
    groupSection: {
        marginBottom: 32,
    },
    groupHeader: {
        fontSize: 14,
        fontWeight: '800',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        marginBottom: 16,
    },
    card: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 8,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaText: {
        fontSize: 14,
        color: '#6B7280',
    },
    metaDistance: {
        fontSize: 14,
        color: '#059669',
        fontWeight: '600',
    },
    filtersRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        gap: 8,
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    filterButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#111827',
    },
    clearFilterBtn: {
        padding: 4,
    },
    locationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    locationButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#111827',
    },
    locationActive: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#D1FAE5',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
        alignSelf: 'flex-start',
        marginTop: 12,
    },
    locationActiveText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#065F46',
    },
    mapsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#DEF7EC',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 6,
        alignSelf: 'flex-start',
        marginTop: 12,
    },
    mapsButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#059669',
    }
});
