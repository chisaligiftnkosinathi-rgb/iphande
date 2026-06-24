import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { API_BASE_URL } from '../../config/api';

export interface LocationSelection {
    province: string;
    municipality: string;
    main_place: string;
    sub_place?: string;
    place_code: string;
}

interface Place {
    id: string;
    place_code: string;
    name: string;
}

interface Props {
    visible: boolean;
    onClose: () => void;
    onSelect: (loc: LocationSelection) => void;
}

export function LocationPicker({ visible, onClose, onSelect }: Props) {
    const [step, setStep] = useState<'province' | 'municipality' | 'main_place' | 'sub_place'>('province');
    const [items, setItems] = useState<Place[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [selProv, setSelProv] = useState<Place | null>(null);
    const [selMuni, setSelMuni] = useState<Place | null>(null);
    const [selMain, setSelMain] = useState<Place | null>(null);

    useEffect(() => {
        if (visible) {
            reset();
            fetchProvinces();
        }
    }, [visible]);

    const reset = () => {
        setStep('province');
        setSelProv(null); setSelMuni(null); setSelMain(null);
        setSearchQuery('');
    };

    const fetchProvinces = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/places/provinces`);
            setItems(await res.json());
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const fetchMunicipalities = async (prov: Place) => {
        setLoading(true); setStep('municipality'); setSelProv(prov); setSearchQuery('');
        try {
            const res = await fetch(`${API_BASE_URL}/places/municipalities?province_code=${prov.place_code}`);
            setItems(await res.json());
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const fetchMainPlaces = async (muni: Place) => {
        setLoading(true); setStep('main_place'); setSelMuni(muni); setSearchQuery('');
        try {
            const res = await fetch(`${API_BASE_URL}/places/main-places?municipality_code=${muni.place_code}`);
            setItems(await res.json());
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const fetchSubPlaces = async (main: Place) => {
        setLoading(true); setStep('sub_place'); setSelMain(main); setSearchQuery('');
        try {
            const res = await fetch(`${API_BASE_URL}/places/sub-places?main_place_code=${main.place_code}`);
            const data = await res.json();
            setItems(data);
            if (data.length === 0) {
                handleFinish(undefined, main); // Auto-skip if no sub-places exist
            }
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const handleFinish = (sub?: Place, fallbackMain?: Place) => {
        const finalMain = selMain || fallbackMain;
        if (!selProv || !selMuni || !finalMain) return;
        onSelect({
            province: selProv.name,
            municipality: selMuni.name,
            main_place: finalMain.name,
            sub_place: sub?.name,
            place_code: sub ? sub.place_code : finalMain.place_code
        });
        onClose();
    };

    const goBack = () => {
        if (step === 'sub_place') fetchMainPlaces(selMuni!);
        else if (step === 'main_place') fetchMunicipalities(selProv!);
        else if (step === 'municipality') { reset(); fetchProvinces(); }
        else onClose();
    };

    const handleSelect = (item: Place) => {
        if (step === 'province') fetchMunicipalities(item);
        else if (step === 'municipality') fetchMainPlaces(item);
        else if (step === 'main_place') fetchSubPlaces(item);
        else handleFinish(item);
    };

    const filteredItems = items.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()));

    let title = "Select Province";
    if (step === 'municipality') title = "Select Municipality";
    if (step === 'main_place') title = "Select Main Place";
    if (step === 'sub_place') title = "Select Sub Place (Optional)";

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <SafeAreaView style={styles.modalContainer}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={goBack} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#111827" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{title}</Text>
                    {step === 'sub_place' && (
                        <TouchableOpacity onPress={() => handleFinish()} style={styles.skipBtn}>
                            <Text style={styles.skipBtnText}>Skip</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.selectionBreadcrumbs}>
                    {selProv && <Text style={styles.breadcrumbText}>{selProv.name}</Text>}
                    {selMuni && <Text style={styles.breadcrumbText}> › {selMuni.name}</Text>}
                    {selMain && <Text style={styles.breadcrumbText}> › {selMain.name}</Text>}
                </View>

                {(step === 'main_place' || step === 'sub_place') && (
                    <View style={styles.searchContainer}>
                        <Ionicons name="search" size={20} color="#6B7280" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search area name..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoFocus={step === 'main_place'}
                        />
                    </View>
                )}

                {loading ? (
                    <ActivityIndicator size="large" color="#111827" style={{ marginTop: 40 }} />
                ) : (
                    <FlatList
                        data={filteredItems}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.listItem} onPress={() => handleSelect(item)}>
                                <Text style={styles.listItemText}>{item.name}</Text>
                                <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={<Text style={styles.emptyText}>No places found.</Text>}
                    />
                )}
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalContainer: { flex: 1, backgroundColor: '#F9FAFB' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderColor: '#E5E7EB' },
    backBtn: { marginRight: 16 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827', flex: 1 },
    skipBtn: { padding: 8 },
    skipBtnText: { color: '#059669', fontWeight: '700', fontSize: 16 },
    selectionBreadcrumbs: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, backgroundColor: '#EFF6FF' },
    breadcrumbText: { fontSize: 13, color: '#1D4ED8', fontWeight: '600' },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', margin: 16, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#D1D5DB' },
    searchInput: { flex: 1, paddingVertical: 12, paddingHorizontal: 8, fontSize: 16 },
    listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderColor: '#F3F4F6' },
    listItemText: { fontSize: 16, color: '#111827' },
    emptyText: { textAlign: 'center', marginTop: 32, color: '#6B7280', fontSize: 15 }
});
