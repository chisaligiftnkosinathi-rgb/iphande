import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { LocationPicker, LocationSelection } from '../../src/components/LocationPicker';
import { API_BASE_URL } from '../../src/config/api';
import { uploadToSupabaseStorage } from '../../src/lib/mediaUpload';
import { supabase } from '../../src/lib/supabase';

export default function NewOpportunityScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [categoryKey, setCategoryKey] = useState('');
    const [serviceNeeded, setServiceNeeded] = useState('');
    const [budgetAmount, setBudgetAmount] = useState('');
    const [contactName, setContactName] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [expiryDate, setExpiryDate] = useState(''); // YYYY-MM-DD

    // Location State
    const [locationData, setLocationData] = useState<LocationSelection | null>(null);
    const [showPicker, setShowPicker] = useState(false);

    // GPS Pin
    const [latitude, setLatitude] = useState<number | null>(null);
    const [longitude, setLongitude] = useState<number | null>(null);
    const [locationLoading, setLocationLoading] = useState(false);

    // Image URIs (local)
    const [image1Uri, setImage1Uri] = useState<string | null>(null);
    const [image2Uri, setImage2Uri] = useState<string | null>(null);

    const pickImage = async (setImage: (uri: string) => void) => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setImage(result.assets[0].uri);
        }
    };

    const dropPin = async () => {
        setLocationLoading(true);
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Permission to access location was denied. Location pin will not be added.');
                setLocationLoading(false);
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            setLatitude(location.coords.latitude);
            setLongitude(location.coords.longitude);
            Alert.alert('Success', 'Location pin added successfully!');
        } catch (err) {
            Alert.alert('Error', 'Could not fetch location. Please try again.');
        } finally {
            setLocationLoading(false);
        }
    };

    const submitOpportunity = async () => {
        if (!title || !serviceNeeded || !contactName || !contactPhone || !locationData) {
            Alert.alert('Missing Fields', 'Please fill in all required fields.');
            return;
        }

        // Basic date validation for YYYY-MM-DD
        if (expiryDate && !/^\d{4}-\d{2}-\d{2}$/.test(expiryDate)) {
            Alert.alert('Invalid Date', 'Expiry date must be in YYYY-MM-DD format.');
            return;
        }

        setLoading(true);
        try {
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData.session?.access_token;
            // The backend requires created_by_profile_id. Assuming the profile ID is the user ID for now,
            // or the user must be authenticated. Wait, the user asked if public customer can post an opportunity.
            // If they can't, they should be logged in.
            // In V1, we assume created_by_profile_id is the session user id.
            const userId = sessionData.session?.user?.id;

            if (!userId || !token) {
                Alert.alert('Authentication required', 'You must be signed in to post an opportunity.');
                setLoading(false);
                return;
            }

            let imageUrl1 = null;
            let imageUrl2 = null;

            if (image1Uri) {
                imageUrl1 = await uploadToSupabaseStorage({
                    bucketName: 'opportunity-images',
                    filePath: image1Uri,
                    fileName: `${userId}_${Date.now()}_1.jpg`,
                    mimeType: 'image/jpeg'
                });
            }

            if (image2Uri) {
                imageUrl2 = await uploadToSupabaseStorage({
                    bucketName: 'opportunity-images',
                    filePath: image2Uri,
                    fileName: `${userId}_${Date.now()}_2.jpg`,
                    mimeType: 'image/jpeg'
                });
            }

            const payload = {
                created_by_profile_id: userId,
                title,
                description,
                province: locationData.province,
                town_or_city: locationData.municipality,
                suburb_or_area: locationData.sub_place ? `${locationData.main_place}, ${locationData.sub_place}` : locationData.main_place,
                place_code: locationData.place_code,
                category_key: categoryKey || 'GENERAL',
                service_needed: serviceNeeded,
                budget_amount: budgetAmount,
                contact_name: contactName,
                contact_phone: contactPhone,
                image_url_1: imageUrl1,
                image_url_2: imageUrl2,
                expiry_date: expiryDate ? new Date(expiryDate).toISOString() : null,
                latitude,
                longitude,
            };

            const response = await fetch(`${API_BASE_URL}/opportunities`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to create opportunity');
            }

            Alert.alert('Success', 'Opportunity posted successfully!');
            router.replace('/explore');
        } catch (err: any) {
            console.error(err);
            Alert.alert('Error', err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.headerTitle}>Post an Opportunity</Text>
            <Text style={styles.headerSubtitle}>Describe what you need and let the community find you.</Text>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Title *</Text>
                <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="e.g. Need a plumber for a leaking pipe" />
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Service Needed *</Text>
                <TextInput style={styles.input} value={serviceNeeded} onChangeText={setServiceNeeded} placeholder="e.g. Plumbing" />
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput style={styles.textArea} value={description} onChangeText={setDescription} placeholder="Describe the job in detail..." multiline numberOfLines={4} />
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Category Key</Text>
                <TextInput style={styles.input} value={categoryKey} onChangeText={setCategoryKey} placeholder="e.g. HOME_SERVICES" />
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Budget Amount</Text>
                <TextInput style={styles.input} value={budgetAmount} onChangeText={setBudgetAmount} placeholder="e.g. R500 - R1500" />
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Expiry Date (YYYY-MM-DD)</Text>
                <TextInput style={styles.input} value={expiryDate} onChangeText={setExpiryDate} placeholder="e.g. 2026-12-31" />
            </View>

            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.formGroup}>
                <Text style={styles.label}>Area *</Text>
                <Pressable style={styles.pickerButton} onPress={() => setShowPicker(true)}>
                    <Text style={locationData ? styles.pickerButtonTextActive : styles.pickerButtonText}>
                        {locationData ? `${locationData.main_place}${locationData.sub_place ? ', ' + locationData.sub_place : ''}` : 'Select Area'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#6B7280" />
                </Pressable>
            </View>
            <View style={styles.formGroup}>
                <Text style={styles.label}>GPS Pin (Optional)</Text>
                {latitude && longitude ? (
                    <View style={styles.pinSuccess}>
                        <Ionicons name="checkmark-circle" size={20} color="#059669" />
                        <Text style={styles.pinSuccessText}>Location attached</Text>
                    </View>
                ) : (
                    <Pressable style={styles.pinButton} onPress={dropPin} disabled={locationLoading}>
                        {locationLoading ? (
                            <ActivityIndicator color="#111827" size="small" />
                        ) : (
                            <>
                                <Ionicons name="location-outline" size={20} color="#111827" />
                                <Text style={styles.pinButtonText}>Add location pin</Text>
                            </>
                        )}
                    </Pressable>
                )}
            </View>

            <Text style={styles.sectionTitle}>Contact Information</Text>
            <View style={styles.formGroup}>
                <Text style={styles.label}>Contact Name *</Text>
                <TextInput style={styles.input} value={contactName} onChangeText={setContactName} placeholder="Your Name" />
            </View>
            <View style={styles.formGroup}>
                <Text style={styles.label}>Contact Phone *</Text>
                <TextInput style={styles.input} value={contactPhone} onChangeText={setContactPhone} placeholder="e.g. 082 123 4567" keyboardType="phone-pad" />
            </View>

            <Text style={styles.sectionTitle}>Photos (Optional)</Text>
            <View style={styles.imageRow}>
                <Pressable style={styles.imagePicker} onPress={() => pickImage(setImage1Uri)}>
                    {image1Uri ? <Image source={{ uri: image1Uri }} style={styles.imagePreview} /> : <Text style={styles.imagePickerText}>+ Photo 1</Text>}
                </Pressable>
                <Pressable style={styles.imagePicker} onPress={() => pickImage(setImage2Uri)}>
                    {image2Uri ? <Image source={{ uri: image2Uri }} style={styles.imagePreview} /> : <Text style={styles.imagePickerText}>+ Photo 2</Text>}
                </Pressable>
            </View>

            <Pressable style={[styles.submitButton, loading && styles.submitButtonDisabled]} onPress={submitOpportunity} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Post Opportunity</Text>}
            </Pressable>

            <LocationPicker
                visible={showPicker}
                onClose={() => setShowPicker(false)}
                onSelect={setLocationData}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    content: {
        padding: 24,
        paddingBottom: 80,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#4B5563',
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        marginTop: 16,
        marginBottom: 16,
    },
    formGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#111827',
    },
    pickerButton: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    pickerButtonText: {
        color: '#9CA3AF',
        fontSize: 16,
    },
    pickerButtonTextActive: {
        color: '#111827',
        fontSize: 16,
    },
    textArea: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#111827',
        minHeight: 100,
        textAlignVertical: 'top',
    },
    imageRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 32,
    },
    imagePicker: {
        flex: 1,
        height: 120,
        backgroundColor: '#E5E7EB',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderStyle: 'dashed',
        overflow: 'hidden',
    },
    imagePickerText: {
        color: '#6B7280',
        fontWeight: '600',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
    },
    submitButton: {
        backgroundColor: '#111827',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 16,
    },
    submitButtonDisabled: {
        backgroundColor: '#9CA3AF',
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    pinButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        padding: 12,
        gap: 8,
    },
    pinButtonText: {
        color: '#111827',
        fontSize: 15,
        fontWeight: '600',
    },
    pinSuccess: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#D1FAE5',
        padding: 12,
        borderRadius: 8,
        gap: 8,
    },
    pinSuccessText: {
        color: '#065F46',
        fontSize: 15,
        fontWeight: '600',
    }
});
