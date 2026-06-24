import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { createPublicAdvertisement } from '../../src/api/advertisementApi';
import { AdvertisementCreate } from '../../src/types/advertisement';
import { Picker } from '@react-native-picker/picker';
import { PROVINCES, TOWNS_BY_PROVINCE, ARCHETYPES } from '../../assets/data/southAfricaLocations';
import { PageHeader } from '../components/PageHeader';

export default function AdvertiseScreen() {
    const router = useRouter();
    
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [categoryKey, setCategoryKey] = useState('');
    const [province, setProvince] = useState('');
    const [townOrCity, setTownOrCity] = useState('');
    const [customTown, setCustomTown] = useState('');
    const [suburbOrArea, setSuburbOrArea] = useState('');
    const [contactName, setContactName] = useState('');
    const [contactWhatsapp, setContactWhatsapp] = useState('');
    const [priceOrBudget, setPriceOrBudget] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async () => {
        const effectiveTown = townOrCity === 'other' ? customTown : townOrCity;
        if (!title || !categoryKey || !province || !effectiveTown || !contactName || !contactWhatsapp) {
            Alert.alert('Missing Fields', 'Please fill in all required fields marked with *');
            return;
        }

        setLoading(true);
        try {
            const data: AdvertisementCreate = {
                title,
                description,
                category_key: categoryKey,
                province,
                town_or_city: effectiveTown,
                suburb_or_area: suburbOrArea,
                contact_name: contactName,
                contact_whatsapp: contactWhatsapp,
                price_or_budget: priceOrBudget
            };
            await createPublicAdvertisement(data);
            setSubmitted(true);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to submit advert. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <View style={styles.container}>
                <PageHeader 
                eyebrow="Public Ecosystem" 
                title="Advertise" 
                subtitle="Share your opportunity with the community." 
            />
                <View style={styles.successContent}>
                    <Ionicons name="checkmark-circle" size={80} color="#10B981" />
                    <Text style={styles.successTitle}>Your advert was submitted.</Text>
                    <Text style={styles.successText}>
                        Please send R2.50 proof/payment confirmation to WhatsApp 27711603850 for review.
                    </Text>
                    <Text style={styles.successSubtext}>
                        Your advert will be reviewed after payment confirmation. If no expiry date was selected, it will run for 3 days.
                    </Text>
                    <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/tabs/index')}>
                        <Text style={styles.primaryButtonText}>Back to Opportunities</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <PageHeader 
                eyebrow="Public Ecosystem" 
                title="Advertise" 
                subtitle="Share your opportunity with the community." 
            />
            <ScrollView style={styles.content}>
                <Text style={styles.infoBox}>
                    Opportunities are for logged-in stewards. As a non-member, you can post a Community Ad for R2.50.
                </Text>

                <Text style={styles.label}>Title *</Text>
                <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="What do you need?" />

                <Text style={styles.label}>Description</Text>
                <TextInput style={[styles.input, { height: 100 }]} value={description} onChangeText={setDescription} placeholder="Provide details..." multiline />

                <Text style={styles.label}>Category *</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={categoryKey}
                        onValueChange={(itemValue) => setCategoryKey(itemValue)}
                        style={styles.picker}
                    >
                        <Picker.Item label="Select Category..." value="" />
                        {ARCHETYPES.map((arch) => (
                            <Picker.Item key={arch.value} label={arch.label} value={arch.value} />
                        ))}
                    </Picker>
                </View>

                <Text style={styles.label}>Province *</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={province}
                        onValueChange={(itemValue) => {
                            setProvince(itemValue);
                            setTownOrCity(''); // Reset town when province changes
                        }}
                        style={styles.picker}
                    >
                        <Picker.Item label="Select Province..." value="" />
                        {PROVINCES.map((prov) => (
                            <Picker.Item key={prov.value} label={prov.label} value={prov.value} />
                        ))}
                    </Picker>
                </View>

                <Text style={styles.label}>Town / City *</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={townOrCity}
                        onValueChange={(itemValue) => setTownOrCity(itemValue)}
                        style={styles.picker}
                        enabled={!!province}
                    >
                        <Picker.Item label="Select Town / City..." value="" />
                        {province && TOWNS_BY_PROVINCE[province]?.map((town) => (
                            <Picker.Item key={town.value} label={town.label} value={town.value} />
                        ))}
                        {province && <Picker.Item label="Other / Not listed" value="other" />}
                    </Picker>
                </View>

                {townOrCity === 'other' && (
                    <TextInput 
                        style={[styles.input, { marginTop: 8 }]} 
                        value={customTown} 
                        onChangeText={setCustomTown} 
                        placeholder="Enter town or city" 
                    />
                )}

                <Text style={styles.label}>Suburb / Area</Text>
                <TextInput style={styles.input} value={suburbOrArea} onChangeText={setSuburbOrArea} placeholder="e.g. Menlyn" />

                <Text style={styles.label}>Your Name *</Text>
                <TextInput style={styles.input} value={contactName} onChangeText={setContactName} placeholder="John Doe" />

                <Text style={styles.label}>WhatsApp Number *</Text>
                <TextInput style={styles.input} value={contactWhatsapp} onChangeText={setContactWhatsapp} placeholder="e.g. +27820000000" keyboardType="phone-pad" />

                <Text style={styles.label}>Budget / Price (Optional)</Text>
                <TextInput style={styles.input} value={priceOrBudget} onChangeText={setPriceOrBudget} placeholder="e.g. R500" />

                <TouchableOpacity style={[styles.primaryButton, loading && styles.buttonDisabled]} onPress={handleSubmit} disabled={loading}>
                    <Text style={styles.primaryButtonText}>{loading ? 'Submitting...' : 'Submit Advert (R2.50)'}</Text>
                </TouchableOpacity>
                
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    backButton: { padding: 5 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
    content: { padding: 20 },
    infoBox: { backgroundColor: '#DBEAFE', padding: 15, borderRadius: 8, color: '#1E40AF', marginBottom: 20, fontSize: 14, lineHeight: 20 },
    label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
    input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, fontSize: 16, color: '#111827' },
    primaryButton: { backgroundColor: '#111827', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 30 },
    primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    buttonDisabled: { opacity: 0.6 },
    
    successContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
    successTitle: { fontSize: 22, fontWeight: '700', color: '#111827', marginTop: 20, marginBottom: 10, textAlign: 'center' },
    successText: { fontSize: 16, color: '#374151', textAlign: 'center', marginBottom: 20, lineHeight: 24, fontWeight: '600' },
    successSubtext: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 40, lineHeight: 20 },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        backgroundColor: '#fff',
        overflow: 'hidden',
    },
    picker: {
        height: 50,
        width: '100%',
    }
});
