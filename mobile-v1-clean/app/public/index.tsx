import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { fetchOpportunities, fetchArchetypes } from '../../src/api/publicProfileApi';
import StatsSaLocationPicker, { StatsSaPlace } from '../components/location/StatsSaLocationPicker';
import { getArchetypeGroups } from '../../src/types/tradeArchetypeTree';
import { useRouter } from 'expo-router';
import { useActionStream } from '../../src/realtime/useActionStream';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONTENT_WIDTH = Math.min(SCREEN_WIDTH, 800);
const PAD = 24;

export default function PublicDirectoryScreen() {
    const router = useRouter();
    const [mode, setMode] = useState<"work" | "people">("work");

    // Live Event Stream
    const profileId = "default-profile-id"; // TODO: plug from auth store
    const { liveActions } = useActionStream(profileId);

    // Filter State (for Work Mode)
    const [filterArchetypes, setFilterArchetypes] = useState<any[]>([]);
    const [selectedArchetype, setSelectedArchetype] = useState('');
    const [location, setLocation] = useState<StatsSaPlace | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    
    // Work Mode State
    const [results, setResults] = useState<any[]>([]);
    const [loadingResults, setLoadingResults] = useState(false);
    
    // People Mode State
    const [archetypes, setArchetypes] = useState<any[]>([]);
    const [loadingPeople, setLoadingPeople] = useState(false);
    
    const [error, setError] = useState<string | null>(null);

    // Initial load of local archetypes for the Picker filter
    useEffect(() => {
        try {
            const archs = getArchetypeGroups();
            setFilterArchetypes(archs || []);
        } catch (err) {
            console.error('Failed to load local archetypes', err);
        }
    }, []);

    // WORK MODE FETCH
    useEffect(() => {
        if (mode !== "work") return;
        if (!selectedArchetype && !location) {
            setResults([]);
            return;
        }

        const load = async () => {
            setLoadingResults(true);
            setError(null);
            try {
                const data = await fetchOpportunities({
                    archetype: selectedArchetype || undefined,
                    province: location?.province,
                    city: location?.municipality,
                });
                setResults(data?.items || data || []);
            } catch (err: any) {
                setError(err.message || "Failed to fetch opportunities");
                setResults([]);
            } finally {
                setLoadingResults(false);
            }
        };

        const t = setTimeout(load, 300);
        return () => clearTimeout(t);
    }, [selectedArchetype, location, mode]);

    // PEOPLE MODE FETCH
    useEffect(() => {
        if (mode !== "people") return;

        const load = async () => {
            setLoadingPeople(true);
            setError(null);
            try {
                const data = await fetchArchetypes();
                setArchetypes(data?.items || data || []);
            } catch (err: any) {
                setError(err.message || "Failed to fetch archetypes");
                setArchetypes([]);
            } finally {
                setLoadingPeople(false);
            }
        };

        load();
    }, [mode]);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>What do you need help with?</Text>
                
                {/* MODE TOGGLE */}
                <View style={styles.modeToggle}>
                    <TouchableOpacity
                        onPress={() => setMode("work")}
                        style={[styles.modeBtn, mode === "work" && styles.modeBtnActive]}
                    >
                        <Text style={[styles.modeText, mode === "work" && styles.modeTextActive]}>
                            Find Work
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setMode("people")}
                        style={[styles.modeBtn, mode === "people" && styles.modeBtnActive]}
                    >
                        <Text style={[styles.modeText, mode === "people" && styles.modeTextActive]}>
                            Find People
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* FILTERS (ONLY IN WORK MODE) */}
                {mode === "work" && (
                    <>
                        <TouchableOpacity 
                            style={styles.filterToggle} 
                            onPress={() => setShowFilters(!showFilters)}
                        >
                            <Text style={styles.filterToggleText}>
                                {showFilters ? 'Hide details' : 'Specify trade or location...'}
                            </Text>
                        </TouchableOpacity>

                        {showFilters && (
                            <View style={styles.filtersContainer}>
                                <View style={styles.pickerContainer}>
                                    <Picker
                                        selectedValue={selectedArchetype}
                                        onValueChange={(val) => setSelectedArchetype(val)}
                                        style={styles.picker}
                                    >
                                        <Picker.Item label="All Trades" value="" color="#9EAD9B" />
                                        {filterArchetypes.map((arch: any) => (
                                            <Picker.Item 
                                                key={arch.key} 
                                                label={arch.label || arch.title || arch.name} 
                                                value={arch.key} 
                                            />
                                        ))}
                                    </Picker>
                                </View>

                                <View style={{ zIndex: 10 }}>
                                    <StatsSaLocationPicker
                                        value={location}
                                        onChange={setLocation}
                                        placeholder="Search city, suburb, or town..."
                                    />
                                </View>
                            </View>
                        )}
                    </>
                )}
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {error && (
                    <View style={styles.errorBox}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                {/* WORK MODE UI */}
                {mode === "work" && (
                    <>
                        {/* LIVE ACTION BANNER */}
                        {liveActions?.length > 0 && (
                            <View style={{
                                padding: 12,
                                backgroundColor: "#111827",
                                borderRadius: 10,
                                marginBottom: 10,
                                marginTop: 16
                            }}>
                                <Text style={{ color: "white", fontWeight: "bold" }}>
                                    🔔 Live Opportunity
                                </Text>

                                <Text style={{ color: "#9CA3AF", marginTop: 4 }}>
                                    {liveActions[0].title}
                                </Text>
                            </View>
                        )}

                        {loadingResults ? (
                            <ActivityIndicator size="large" color="#111827" style={{ marginTop: 40 }} />
                        ) : results.length === 0 && !error ? (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyIcon}>🔍</Text>
                                <Text style={styles.emptyTitle}>No opportunities found</Text>
                                <Text style={styles.emptyText}>
                                    Try broadening your location or selecting a different trade.
                                </Text>
                            </View>
                        ) : (
                            [...liveActions, ...results].map((item: any, idx: number) => (
                                <View key={item.id || `live-${idx}`} style={styles.resultCard}>
                                    <View style={styles.resultHeader}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.stewardName}>{item.title || item.name || 'Opportunity'}</Text>
                                            <Text style={styles.stewardTrade}>
                                                {item.body || item.business_line || item.archetype || 'General'}
                                            </Text>
                                        </View>
                                    </View>
                                    
                                    {item.city && (
                                        <View style={styles.resultMeta}>
                                            <Text style={styles.metaText}>
                                                📍 {[item.city, item.province].filter(Boolean).join(', ') || item.location_name}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            ))
                        )}
                    </>
                )}

                {/* PEOPLE MODE UI */}
                {mode === "people" && (
                    <>
                        {loadingPeople ? (
                            <ActivityIndicator size="large" color="#111827" style={{ marginTop: 40 }} />
                        ) : archetypes.length === 0 && !error ? (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyIcon}>👥</Text>
                                <Text style={styles.emptyTitle}>No categories found</Text>
                            </View>
                        ) : (
                            archetypes.map((a: any) => (
                                <TouchableOpacity 
                                    key={a.key || Math.random().toString()} 
                                    style={styles.archetypeCard}
                                    onPress={() => router.push(`/public/category/${a.key}`)}
                                >
                                    <Text style={styles.archetypeCardText}>{a.label || a.name || a.key}</Text>
                                </TouchableOpacity>
                            ))
                        )}
                    </>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    content: { paddingBottom: 80, paddingHorizontal: PAD, maxWidth: CONTENT_WIDTH, alignSelf: 'center', width: '100%' },

    header: { 
        backgroundColor: '#FFFFFF',
        paddingHorizontal: PAD,
        paddingTop: 60,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderColor: '#F3F4F6',
        zIndex: 100,
    },
    title: { fontSize: 28, fontWeight: '800', color: '#111827', marginBottom: 16 },
    
    // Toggle Styles
    modeToggle: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        padding: 4,
        marginBottom: 16,
    },
    modeBtn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 6,
    },
    modeBtnActive: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    modeText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    modeTextActive: {
        color: '#111827',
    },

    filterToggle: {
        backgroundColor: '#F3F4F6',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    filterToggleText: {
        color: '#4B5563',
        fontSize: 15,
        fontWeight: '500',
    },
    filtersContainer: {
        marginTop: 8,
        gap: 12,
    },
    pickerContainer: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 10,
        overflow: 'hidden',
    },
    picker: { height: 50, color: '#111827' },

    errorBox: { marginTop: 24, padding: 16, backgroundColor: '#FEF2F2', borderRadius: 10, borderWidth: 1, borderColor: '#FCA5A5' },
    errorText: { color: '#991B1B', fontSize: 14, fontWeight: '600', textAlign: 'center' },

    emptyState: { alignItems: 'center', paddingVertical: 40 },
    emptyIcon: { fontSize: 40, marginBottom: 16 },
    emptyTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 8 },
    emptyText: { textAlign: 'center', fontSize: 15, color: '#6B7280', lineHeight: 22 },

    resultCard: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 16,
        marginTop: 16,
    },
    resultHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
    stewardName: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 2 },
    stewardTrade: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
    
    resultMeta: { marginBottom: 16 },
    metaText: { fontSize: 14, color: '#4B5563' },

    archetypeCard: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 12,
        marginTop: 8,
    },
    archetypeCardText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    }
});
