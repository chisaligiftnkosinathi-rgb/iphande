import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity, TextInput, Modal, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { useSteward } from '../../src/context/StewardContext';
import { fetchOpportunities, createOpportunity, updateOpportunity } from '../../src/services/opportunityApi';
import { OpportunityOut, OpportunityCreate } from '../../src/types/opportunity';
import { fetchActiveAdvertisements } from '../../src/services/advertisementApi';
import { AdvertisementOut } from '../../src/types/advertisement';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { PROVINCES, TOWNS_BY_PROVINCE, ARCHETYPES } from '../../src/data/southAfricaLocations';
import { PageHeader } from '../../src/components/PageHeader';
import { theme } from '../../src/config/theme';

type FeedItem = 
    | { type: 'opportunity'; data: OpportunityOut }
    | { type: 'advertisement'; data: AdvertisementOut };

type SectionData = {
    title: string;
    data: FeedItem[];
};

export default function OpportunitiesScreen() {
    const { session } = useAuth();
    const { profile } = useSteward();
    const router = useRouter();

    const [sections, setSections] = useState<SectionData[]>([]);
    const [otherOpportunities, setOtherOpportunities] = useState<FeedItem[]>([]);
    const [showOther, setShowOther] = useState(false);
    
    const [loading, setLoading] = useState(true);
    
    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [filterProvince, setFilterProvince] = useState('');
    const [filterTown, setFilterTown] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [oppsError, setOppsError] = useState('');
    const [customFilterTown, setCustomFilterTown] = useState('');
    const [customNewTown, setCustomNewTown] = useState('');

    const [isCreateModalVisible, setCreateModalVisible] = useState(false);
    
    // Create form state
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newProvince, setNewProvince] = useState('');
    const [newTown, setNewTown] = useState('');
    const [newArea, setNewArea] = useState('');
    const [newCategory, setNewCategory] = useState('');
    const [newService, setNewService] = useState('');
    const [newBudget, setNewBudget] = useState('');
    const [newContactName, setNewContactName] = useState('');
    const [newContactPhone, setNewContactPhone] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            loadOpportunities();
        }, 300);
        return () => clearTimeout(timer);
    }, [filterProvince, filterTown, filterCategory, searchQuery]);

    const loadOpportunities = async () => {
        try {
            setLoading(true);
            setOppsError('');
            
            const effectiveFilterTown = filterTown === 'other' ? customFilterTown : filterTown;
            const filters = {
                province: filterProvince || undefined,
                town_or_city: effectiveFilterTown || undefined,
                category_key: filterCategory || undefined,
                q: searchQuery || undefined
            };
            const [oppResult, adResult] = await Promise.allSettled([
                fetchOpportunities(filters),
                fetchActiveAdvertisements(filters)
            ]);
            
            const openOpps: FeedItem[] = [];
            const otherOpps: FeedItem[] = [];
            const activeAds: FeedItem[] = [];

            // Group Opportunities
            if (oppResult.status === 'fulfilled') {
                oppResult.value.forEach(opp => {
                    if (opp.status === 'open') {
                        openOpps.push({ type: 'opportunity', data: opp });
                    } else if (opp.status === 'contacted' || opp.status === 'quoted' || opp.status === 'closed') {
                        otherOpps.push({ type: 'opportunity', data: opp });
                    }
                });
            } else {
                setOppsError('Opportunities could not load. Check your connection or try again.');
            }

            // Group Ads
            if (adResult.status === 'fulfilled') {
                adResult.value.forEach(ad => {
                    activeAds.push({ type: 'advertisement', data: ad });
                });
            } else {
                console.error('Failed to load community ads', adResult.reason);
            }

            // Sort each array descending by created_at
            openOpps.sort((a, b) => new Date(b.data.created_at || 0).getTime() - new Date(a.data.created_at || 0).getTime());
            activeAds.sort((a, b) => new Date(b.data.created_at || 0).getTime() - new Date(a.data.created_at || 0).getTime());
            otherOpps.sort((a, b) => new Date(b.data.created_at || 0).getTime() - new Date(a.data.created_at || 0).getTime());
            
            const newSections: SectionData[] = [];
            if (openOpps.length > 0) {
                newSections.push({ title: 'Open Opportunities', data: openOpps });
            }
            if (activeAds.length > 0) {
                newSections.push({ title: 'Community Ads', data: activeAds });
            }
            
            setSections(newSections);
            setOtherOpportunities(otherOpps);
        } catch (err) {
            console.error('Failed to load opportunities:', err);
        } finally {
            setLoading(false);
        }
    };

    const clearFilters = () => {
        setSearchQuery('');
        setFilterProvince('');
        setFilterTown('');
        setFilterCategory('');
    };

    const handleCreateOpportunity = async () => {
        if (!profile?.id) return;
        const effectiveNewTown = newTown === 'other' ? customNewTown : newTown;
        if (!newTitle || !newProvince || !effectiveNewTown || !newCategory || !newContactPhone) {
            Alert.alert('Validation Error', 'Please fill in Title, Category, Province, Town, and Contact Phone.');
            return;
        }

        try {
            const oppData: OpportunityCreate = {
                created_by_profile_id: profile.id,
                title: newTitle,
                description: newDesc,
                province: newProvince,
                town_or_city: effectiveNewTown,
                suburb_or_area: newArea,
                category_key: newCategory,
                service_needed: newService,
                budget_amount: newBudget,
                contact_name: newContactName,
                contact_phone: newContactPhone,
            };
            await createOpportunity(oppData);
            setCreateModalVisible(false);
            
            // Reset form
            setNewTitle(''); setNewDesc(''); setNewProvince(''); setNewTown(''); setNewArea('');
            setNewCategory(''); setNewService(''); setNewBudget(''); setNewContactName(''); setNewContactPhone('');
            
            loadOpportunities();
            Alert.alert("Success", "Opportunity created successfully.");
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to create opportunity');
        }
    };

    const handleContact = async (opp: OpportunityOut) => {
        try {
            if (opp.status === 'open') {
                await updateOpportunity(opp.id, { status: 'contacted' });
                loadOpportunities();
            }
            Alert.alert('Contacted', `Please reach out to ${opp.contact_name} on WhatsApp: ${opp.contact_phone}`);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateQuote = async (opp: OpportunityOut) => {
        try {
            if (opp.status === 'open') {
                await updateOpportunity(opp.id, { status: 'contacted' });
            }
            router.push(`/tools/calculator?oppId=${opp.id}&name=${encodeURIComponent(opp.contact_name || '')}&phone=${encodeURIComponent(opp.contact_phone || '')}&desc=${encodeURIComponent(opp.service_needed || opp.title || '')}`);
        } catch (err) {
            console.error(err);
        }
    };

    const renderHeader = () => (
        <View style={styles.listHeader}>
            <PageHeader 
                eyebrow="Community"
                title="Opportunities"
                subtitle="Find needs by place, skill, and service."
            />

            {/* Search + Filters card */}
            <View style={theme.styles.card}>
                <View style={styles.searchRow}>
                    <Ionicons name="search" size={20} color={theme.colors.textMuted} style={styles.searchIcon} />
                    <TextInput 
                        style={styles.searchInput} 
                        placeholder="Search keywords..." 
                        placeholderTextColor={theme.colors.textMuted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                <View style={styles.pickerRow}>
                    <View style={styles.pickerWrapper}>
                        <Picker
                            selectedValue={filterProvince}
                            onValueChange={(val) => {
                                setFilterProvince(val);
                                setFilterTown('');
                            }}
                            style={styles.pickerElement}
                        >
                            <Picker.Item label="Province" value="" />
                            {PROVINCES.map(p => <Picker.Item key={p.value} label={p.label} value={p.value} />)}
                        </Picker>
                    </View>
                    <View style={styles.pickerWrapper}>
                        <Picker
                            selectedValue={filterTown}
                            onValueChange={setFilterTown}
                            style={styles.pickerElement}
                            enabled={!!filterProvince}
                        >
                            <Picker.Item label="Town/City" value="" />
                            {filterProvince && TOWNS_BY_PROVINCE[filterProvince]?.map(t => <Picker.Item key={t.value} label={t.label} value={t.value} />)}
                            {filterProvince && <Picker.Item label="Other / Not listed" value="other" />}
                        </Picker>
                    </View>
                </View>
                {filterTown === 'other' && (
                    <TextInput 
                        style={[styles.searchInput, { marginBottom: 12, marginTop: -4 }]} 
                        placeholder="Enter town or city"
                        placeholderTextColor={theme.colors.textMuted}
                        value={customFilterTown}
                        onChangeText={setCustomFilterTown}
                    />
                )}
                
                <View style={styles.pickerRow}>
                    <View style={styles.pickerWrapper}>
                        <Picker
                            selectedValue={filterCategory}
                            onValueChange={setFilterCategory}
                            style={styles.pickerElement}
                        >
                            <Picker.Item label="Category" value="" />
                            {ARCHETYPES.map(a => <Picker.Item key={a.value} label={a.label} value={a.value} />)}
                        </Picker>
                    </View>
                </View>

                {(searchQuery || filterProvince || filterTown || filterCategory) ? (
                    <TouchableOpacity style={styles.clearFilterButton} onPress={clearFilters}>
                        <Text style={styles.clearFilterText}>Clear Filters</Text>
                    </TouchableOpacity>
                ) : null}
            </View>

            {/* Primary Action Card */}
            <View style={[theme.styles.card, { marginTop: 16, marginBottom: 24 }]}>
                <Text style={styles.sectionTitle}>What can you create?</Text>
                <View style={styles.actionButtonsRow}>
                    {session && profile ? (
                        <TouchableOpacity style={styles.primaryActionButton} onPress={() => setCreateModalVisible(true)}>
                            <Ionicons name="add-circle-outline" size={20} color="#fff" />
                            <Text style={styles.primaryActionText}>Create Opportunity</Text>
                        </TouchableOpacity>
                    ) : null}
                    
                    <TouchableOpacity style={styles.secondaryActionButton} onPress={() => router.push('/public/advertise')}>
                        <Ionicons name="megaphone-outline" size={20} color={theme.colors.navy} />
                        <Text style={styles.secondaryActionText}>Advertise Community Need (R2.50)</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {oppsError ? (
                <View style={{ backgroundColor: '#FEE2E2', padding: 12, borderRadius: 8, marginBottom: 16 }}>
                    <Text style={{ color: '#991B1B', fontSize: 14, fontWeight: '600' }}>{oppsError}</Text>
                </View>
            ) : null}
        </View>
    );

    const renderFooter = () => {
        if (otherOpportunities.length === 0) return null;
        
        return (
            <View style={{ marginTop: 24 }}>
                <TouchableOpacity style={styles.toggleClosedBtn} onPress={() => setShowOther(!showOther)}>
                    <Text style={styles.toggleClosedText}>{showOther ? "Hide" : "Show"} Other Opportunities ({otherOpportunities.length})</Text>
                    <Ionicons name={showOther ? "chevron-up" : "chevron-down"} size={20} color={theme.colors.textMuted} />
                </TouchableOpacity>
                
                {showOther && (
                    <View style={{ marginTop: 16 }}>
                        {otherOpportunities.map(item => renderItem({ item }))}
                    </View>
                )}
            </View>
        );
    };

    const renderItem = ({ item }: { item: FeedItem }) => {
        if (item.type === 'opportunity') {
            const opp = item.data;
            const isOpen = opp.status === 'open';
            return (
                <View style={[theme.styles.card, styles.feedCard, !isOpen && { opacity: 0.7 }]} key={`opp-${opp.id}`}>
                    <View style={styles.cardHeader}>
                        <View style={styles.badgeSteward}>
                            <Text style={styles.badgeStewardText}>Steward Opportunity</Text>
                        </View>
                        {!isOpen && (
                            <View style={styles.badgeClosed}>
                                <Text style={styles.badgeClosedText}>{opp.status}</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.cardTitle}>{opp.title}</Text>
                    
                    <View style={styles.metaRow}>
                        <Ionicons name="location-outline" size={14} color={theme.colors.textMuted} />
                        <Text style={styles.metaText}>{opp.town_or_city}, {opp.province} {opp.suburb_or_area ? `(${opp.suburb_or_area})` : ''}</Text>
                    </View>
                    <View style={styles.metaRow}>
                        <Ionicons name="construct-outline" size={14} color={theme.colors.textMuted} />
                        <Text style={styles.metaText}>{opp.service_needed || opp.category_key}</Text>
                    </View>

                    {opp.budget_amount ? <Text style={styles.budget}>Budget: R{opp.budget_amount}</Text> : null}
                    
                    <Text style={styles.contactName}>Contact: {opp.contact_name}</Text>

                    {isOpen && (
                        <View style={styles.cardActionsRow}>
                            <TouchableOpacity style={styles.actionBtnOutline} onPress={() => handleContact(opp)}>
                                <Ionicons name="logo-whatsapp" size={16} color={theme.colors.navy} />
                                <Text style={styles.actionBtnOutlineText}>WhatsApp</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionBtnSolid} onPress={() => handleCreateQuote(opp)}>
                                <Ionicons name="document-text-outline" size={16} color="#fff" />
                                <Text style={styles.actionBtnSolidText}>Create Quote</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            );
        } else {
            const ad = item.data;
            return (
                <View style={[theme.styles.card, styles.feedCard, styles.adCard]} key={`ad-${ad.id}`}>
                    <View style={styles.cardHeader}>
                        <View style={styles.badgeAd}>
                            <Text style={styles.badgeAdText}>Community Ad</Text>
                        </View>
                    </View>
                    <Text style={styles.cardTitle}>{ad.title}</Text>
                    
                    <View style={styles.metaRow}>
                        <Ionicons name="location-outline" size={14} color={theme.colors.textMuted} />
                        <Text style={styles.metaText}>{ad.town_or_city}, {ad.province}</Text>
                    </View>
                    <View style={styles.metaRow}>
                        <Ionicons name="grid-outline" size={14} color={theme.colors.textMuted} />
                        <Text style={styles.metaText}>{ad.category_key}</Text>
                    </View>
                    
                    {ad.price_or_budget ? <Text style={styles.budget}>Budget/Price: {ad.price_or_budget}</Text> : null}
                    
                    <Text style={styles.contactName}>Contact: {ad.contact_name}</Text>

                    <View style={styles.cardActionsRow}>
                        <TouchableOpacity style={styles.actionBtnOutline} onPress={() => {
                            Alert.alert('Contacted', `Please reach out to ${ad.contact_name} on WhatsApp: ${ad.contact_whatsapp}`);
                        }}>
                            <Ionicons name="logo-whatsapp" size={16} color={theme.colors.navy} />
                            <Text style={styles.actionBtnOutlineText}>WhatsApp</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }
    };

    return (
        <View style={styles.container}>
            <SectionList
                sections={sections}
                keyExtractor={(item, index) => item.type + '-' + index}
                renderItem={renderItem}
                renderSectionHeader={({ section: { title } }) => (
                    <Text style={styles.feedHeading}>{title}</Text>
                )}
                ListHeaderComponent={renderHeader}
                ListFooterComponent={renderFooter}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    !loading ? (
                        oppsError ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="alert-circle-outline" size={48} color={theme.colors.border} />
                                <Text style={styles.emptyText}>Opportunities could not load.</Text>
                                <TouchableOpacity onPress={loadOpportunities} style={{ marginTop: 16, backgroundColor: theme.colors.borderSoft, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}>
                                    <Text style={{ color: theme.colors.navy, fontWeight: '600' }}>Retry</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.emptyState}>
                                <Ionicons name="search-outline" size={48} color={theme.colors.border} />
                                <Text style={styles.emptyText}>No opportunities found here yet.</Text>
                                <Text style={styles.emptySubtext}>Create one for your community.</Text>
                            </View>
                        )
                    ) : (
                        <Text style={styles.loadingText}>Loading opportunities...</Text>
                    )
                }
            />

            {/* Create Opportunity Studio Modal */}
            <Modal visible={isCreateModalVisible} animationType="slide" presentationStyle="pageSheet">
                <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Create Opportunity</Text>
                        <TouchableOpacity onPress={() => setCreateModalVisible(false)} style={styles.closeBtn}>
                            <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.modalContent} contentContainerStyle={{ paddingBottom: 60 }}>
                        <Text style={styles.modalSubtitle}>Post a need on behalf of a community member.</Text>
                        
                        <Text style={styles.label}>Title *</Text>
                        <TextInput style={theme.styles.input} value={newTitle} onChangeText={setNewTitle} placeholder="e.g. Need a plumber for geyser" />

                        <Text style={styles.label}>Description</Text>
                        <TextInput style={[theme.styles.input, { height: 80, paddingTop: 12 }]} value={newDesc} onChangeText={setNewDesc} multiline placeholder="Provide details..." />

                        <Text style={styles.label}>Category *</Text>
                        <View style={styles.modalPickerContainer}>
                            <Picker selectedValue={newCategory} onValueChange={setNewCategory} style={styles.modalPicker}>
                                <Picker.Item label="Select Category..." value="" />
                                {ARCHETYPES.map(a => <Picker.Item key={a.value} label={a.label} value={a.value} />)}
                            </Picker>
                        </View>

                        <Text style={styles.label}>Service Needed</Text>
                        <TextInput style={theme.styles.input} value={newService} onChangeText={setNewService} placeholder="e.g. Geyser replacement" />

                        <Text style={styles.label}>Budget (Optional)</Text>
                        <TextInput style={theme.styles.input} value={newBudget} onChangeText={setNewBudget} placeholder="e.g. 1500" keyboardType="numeric" />

                        <Text style={styles.label}>Province *</Text>
                        <View style={styles.modalPickerContainer}>
                            <Picker
                                selectedValue={newProvince}
                                onValueChange={(val) => {
                                    setNewProvince(val);
                                    setNewTown('');
                                }}
                                style={styles.modalPicker}
                            >
                                <Picker.Item label="Select Province..." value="" />
                                {PROVINCES.map(p => <Picker.Item key={p.value} label={p.label} value={p.value} />)}
                            </Picker>
                        </View>

                        <Text style={styles.label}>Town / City *</Text>
                        <View style={styles.modalPickerContainer}>
                            <Picker
                                selectedValue={newTown}
                                onValueChange={setNewTown}
                                style={styles.modalPicker}
                                enabled={!!newProvince}
                            >
                                <Picker.Item label="Select Town / City..." value="" />
                                {newProvince && TOWNS_BY_PROVINCE[newProvince]?.map(t => <Picker.Item key={t.value} label={t.label} value={t.value} />)}
                                {newProvince && <Picker.Item label="Other / Not listed" value="other" />}
                            </Picker>
                        </View>
                        {newTown === 'other' && (
                            <TextInput 
                                style={[theme.styles.input, { marginTop: 8 }]} 
                                placeholder="Enter town or city" 
                                value={customNewTown} 
                                onChangeText={setCustomNewTown} 
                            />
                        )}

                        <Text style={styles.label}>Suburb / Area</Text>
                        <TextInput style={theme.styles.input} value={newArea} onChangeText={setNewArea} placeholder="e.g. Menlyn" />

                        <Text style={styles.label}>Contact Name</Text>
                        <TextInput style={theme.styles.input} value={newContactName} onChangeText={setNewContactName} placeholder="e.g. John Doe" />

                        <Text style={styles.label}>Contact Phone *</Text>
                        <TextInput style={theme.styles.input} value={newContactPhone} onChangeText={setNewContactPhone} placeholder="e.g. +27820000000" keyboardType="phone-pad" />

                        <TouchableOpacity style={styles.submitModalBtn} onPress={handleCreateOpportunity}>
                            <Text style={styles.submitModalBtnText}>Post Opportunity</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    listContent: { padding: 16, paddingBottom: 40 },
    listHeader: { marginBottom: 16 },
    
    // Search & Filters
    searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 8, paddingHorizontal: 12, marginBottom: 12 },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, height: 40, fontSize: 16, color: theme.colors.textPrimary },
    pickerRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    pickerWrapper: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 8, height: 44, justifyContent: 'center', overflow: 'hidden' },
    pickerElement: { width: '100%', height: 44, color: theme.colors.textPrimary },
    clearFilterButton: { alignSelf: 'flex-end', padding: 8 },
    clearFilterText: { color: theme.colors.trustGreen, fontWeight: '600', fontSize: 14 },

    // Action Card
    sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.textPrimary, marginBottom: 12 },
    actionButtonsRow: { gap: 12 },
    primaryActionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.trustGreen, borderRadius: 12, paddingVertical: 14, gap: 8 },
    primaryActionText: { color: '#fff', fontSize: 15, fontWeight: '600' },
    secondaryActionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.borderSoft, borderRadius: 12, paddingVertical: 14, gap: 8 },
    secondaryActionText: { color: theme.colors.navy, fontSize: 15, fontWeight: '600' },

    // Feed
    feedHeading: { fontSize: 18, fontWeight: '700', color: theme.colors.textPrimary, marginTop: 12, marginBottom: 12 },
    feedCard: { marginBottom: 16, padding: 20 },
    adCard: { borderColor: '#DBEAFE', backgroundColor: '#F8FAFC' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    badgeSteward: { backgroundColor: '#DEF7EC', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    badgeStewardText: { color: '#03543F', fontSize: 12, fontWeight: '700' },
    badgeAd: { backgroundColor: '#DBEAFE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    badgeAdText: { color: '#1E40AF', fontSize: 12, fontWeight: '700' },
    badgeClosed: { backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    badgeClosedText: { color: theme.colors.textMuted, fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
    
    cardTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.textPrimary, marginBottom: 8 },
    metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 6 },
    metaText: { fontSize: 14, color: theme.colors.textMuted },
    budget: { fontSize: 14, fontWeight: '600', color: theme.colors.trustGreen, marginTop: 4, marginBottom: 8 },
    contactName: { fontSize: 14, color: theme.colors.textPrimary, fontWeight: '500', marginBottom: 16 },

    cardActionsRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
    actionBtnOutline: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, paddingVertical: 10, gap: 6 },
    actionBtnOutlineText: { color: theme.colors.navy, fontWeight: '600', fontSize: 14 },
    actionBtnSolid: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.navy, borderRadius: 8, paddingVertical: 10, gap: 6 },
    actionBtnSolidText: { color: '#fff', fontWeight: '600', fontSize: 14 },

    // Footer & Empty
    toggleClosedBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, backgroundColor: theme.colors.borderSoft, borderRadius: 12 },
    toggleClosedText: { fontSize: 15, fontWeight: '600', color: theme.colors.textMuted },
    loadingText: { textAlign: 'center', marginTop: 40, color: theme.colors.textMuted },
    emptyState: { alignItems: 'center', marginTop: 40, padding: 24 },
    emptyText: { fontSize: 16, fontWeight: '600', color: theme.colors.textPrimary, marginTop: 12 },
    emptySubtext: { fontSize: 14, color: theme.colors.textMuted, marginTop: 4 },

    // Modal
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 24, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    modalTitle: { fontSize: 20, fontWeight: '700', color: theme.colors.textPrimary },
    closeBtn: { padding: 4 },
    modalContent: { padding: 20, backgroundColor: '#fff' },
    modalSubtitle: { fontSize: 15, color: theme.colors.textMuted, marginBottom: 24 },
    label: { fontSize: 14, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: 8, marginTop: 16 },
    modalPickerContainer: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, backgroundColor: '#fff', overflow: 'hidden' },
    modalPicker: { height: 48, width: '100%' },
    submitModalBtn: { backgroundColor: theme.colors.trustGreen, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 32 },
    submitModalBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
