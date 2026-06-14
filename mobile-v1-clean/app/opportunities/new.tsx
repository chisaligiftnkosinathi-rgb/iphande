import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Alert, Pressable, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { uploadToSupabaseStorage } from '../../src/lib/mediaUpload';
import { supabase } from '../../src/lib/supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

export default function NewOpportunityScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [province, setProvince] = useState('');
    const [townOrCity, setTownOrCity] = useState('');
    const [suburbOrArea, setSuburbOrArea] = useState('');
    const [categoryKey, setCategoryKey] = useState('');
    const [serviceNeeded, setServiceNeeded] = useState('');
    const [budgetAmount, setBudgetAmount] = useState('');
    const [contactName, setContactName] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [expiryDate, setExpiryDate] = useState(''); // YYYY-MM-DD

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

    const submitOpportunity = async () => {
        if (!title || !serviceNeeded || !contactName || !contactPhone || !province || !townOrCity) {
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
                province,
                town_or_city: townOrCity,
                suburb_or_area: suburbOrArea,
                category_key: categoryKey || 'GENERAL',
                service_needed: serviceNeeded,
                budget_amount: budgetAmount,
                contact_name: contactName,
                contact_phone: contactPhone,
                image_url_1: imageUrl1,
                image_url_2: imageUrl2,
                expiry_date: expiryDate ? new Date(expiryDate).toISOString() : null,
            };

            const response = await fetch(`${API_URL}/api/v1/opportunities`, {
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
                <Text style={styles.label}>Province *</Text>
                <TextInput style={styles.input} value={province} onChangeText={setProvince} placeholder="e.g. Gauteng" />
            </View>
            <View style={styles.formGroup}>
                <Text style={styles.label}>Town/City *</Text>
                <TextInput style={styles.input} value={townOrCity} onChangeText={setTownOrCity} placeholder="e.g. Johannesburg" />
            </View>
            <View style={styles.formGroup}>
                <Text style={styles.label}>Suburb/Area</Text>
                <TextInput style={styles.input} value={suburbOrArea} onChangeText={setSuburbOrArea} placeholder="e.g. Sandton" />
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
});
