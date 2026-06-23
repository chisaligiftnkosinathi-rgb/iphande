import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const API_BASE_URL = 'http://localhost:8000';
const { width } = Dimensions.get('window');

export default function VisibilityProfileEditor() {
    // Mocking profile ID for V1 until Auth Context is fully wired
    const [profileId, setProfileId] = useState('your-profile-uuid');
    const [isPreview, setIsPreview] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    // Mobile state for picked image URIs
    const [localImages, setLocalImages] = useState<string[]>([]);

    const [form, setForm] = useState({
        name: '',
        slug: '',
        short_bio: '',
        whatsapp_number: '',
        facebook_page_url: '',
        province: '',
        city: '',
        suburb: '',
        services: '',
        cover_photo_url: '',
        logo_url: '',
        supporting_image_urls: '', // comma separated string
        is_public: true,
    });

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // TODO: local_uri -> upload storage -> public_url -> profile media.
            // For now, we only save the normal profile fields to the backend.
            const response = await fetch(`${API_BASE_URL}/api/v1/profiles/${profileId}/visibility`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });

            if (!response.ok) throw new Error('Failed to update visibility profile');
            Alert.alert('Success', 'Your visibility profile has been updated!');
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Could not save profile.');
        } finally {
            setIsSaving(false);
        }
    };

    const pickImages = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            selectionLimit: 5,
            quality: 0.8,
        });

        if (!result.cancelled) {
            const selected = Array.isArray((result as any).selected) ? (result as any).selected : [result];
            const uris = selected.map((asset: { uri: string }) => asset.uri);
            setLocalImages(uris.slice(0, 5));
        }
    };

    const renderPreview = () => {
        const locationString = [form.suburb, form.city, form.province].filter(Boolean).join(', ') || 'Location not set';
        const servicesList = form.services.split(',').map(s => s.trim()).filter(Boolean);
        const imagesList = localImages.length > 0 ? localImages : form.supporting_image_urls.split(',').map(s => s.trim()).filter(Boolean);

        return (
            <ScrollView style={styles.previewContainer}>
                {/* Hero Canopy */}
                <View style={styles.heroContainer}>
                    <Image source={{ uri: form.cover_photo_url || 'https://via.placeholder.com/800x400?text=No+Cover' }} style={styles.heroImage} />
                </View>

                {/* Identity Core */}
                <View style={styles.identityCenter}>
                    <View style={styles.avatarRing}>
                        <Image source={{ uri: form.logo_url || 'https://via.placeholder.com/200?text=Logo' }} style={styles.avatar} />
                    </View>
                    <Text style={styles.businessName}>{form.name || 'Business Name'}</Text>
                    <Text style={styles.locationText}>📍 {locationString}</Text>
                </View>

                {/* Story */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>The Story</Text>
                    <Text style={styles.storyText}>"{form.short_bio || 'Your story goes here...'}"</Text>
                </View>

                {/* Services Orbit */}
                {servicesList.length > 0 && (
                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>Services</Text>
                        {servicesList.map((service, idx) => <Text key={idx} style={styles.listItem}>• {service}</Text>)}
                    </View>
                )}

                {/* Contact CTA */}
                {form.whatsapp_number ? (
                    <View style={styles.whatsappButtonPreview}>
                        <Text style={styles.whatsappButtonText}>💬 Connect on WhatsApp</Text>
                    </View>
                ) : null}

                {/* Gallery Orbit */}
                {imagesList.length > 0 && (
                    <View style={styles.galleryOrbit}>
                        <Text style={styles.sectionTitle}>Proof of Work</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {imagesList.map((img, idx) => (
                                <Image key={idx} source={{ uri: img }} style={styles.galleryImage} />
                            ))}
                        </ScrollView>
                    </View>
                )}
            </ScrollView>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerBar}>
                <Text style={styles.headerTitle}>Steward Profile</Text>
                <View style={styles.toggleContainer}>
                    <Text style={styles.toggleLabel}>Preview</Text>
                    <Switch value={isPreview} onValueChange={setIsPreview} />
                </View>
            </View>

            {isPreview ? (
                renderPreview()
            ) : (
                <ScrollView style={styles.formContainer} contentContainerStyle={styles.formContent}>
                    <Text style={styles.instruction}>Water your tree. Build your visibility card so the community can find you.</Text>

                    <Text style={styles.label}>Business Name</Text>
                    <TextInput style={styles.input} value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} placeholder="Mandla Auto Repairs" />

                    <Text style={styles.label}>Profile Link (Slug)</Text>
                    <TextInput style={styles.input} value={form.slug} onChangeText={(t) => setForm({ ...form, slug: t })} placeholder="mandla-auto" autoCapitalize="none" />

                    <Text style={styles.label}>The Story (Short Bio)</Text>
                    <TextInput style={styles.textArea} value={form.short_bio} onChangeText={(t) => setForm({ ...form, short_bio: t })} placeholder="Why do you do what you do?" multiline />

                    <Text style={styles.label}>WhatsApp Number</Text>
                    <TextInput style={styles.input} value={form.whatsapp_number} onChangeText={(t) => setForm({ ...form, whatsapp_number: t })} placeholder="27710000000" keyboardType="phone-pad" />

                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                            <Text style={styles.label}>Province</Text>
                            <TextInput style={styles.input} value={form.province} onChangeText={(t) => setForm({ ...form, province: t })} placeholder="Gauteng" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>City</Text>
                            <TextInput style={styles.input} value={form.city} onChangeText={(t) => setForm({ ...form, city: t })} placeholder="Benoni" />
                        </View>
                    </View>

                    <Text style={styles.label}>Services (Comma separated)</Text>
                    <TextInput style={styles.input} value={form.services} onChangeText={(t) => setForm({ ...form, services: t })} placeholder="Vehicle Service, Brake Repairs, Diagnostics" />

                    <Text style={styles.label}>Profile Photo URL (Logo)</Text>
                    <TextInput style={styles.input} value={form.logo_url} onChangeText={(t) => setForm({ ...form, logo_url: t })} placeholder="https://..." />

                    <Text style={styles.label}>Hero Canopy URL (Cover)</Text>
                    <TextInput style={styles.input} value={form.cover_photo_url} onChangeText={(t) => setForm({ ...form, cover_photo_url: t })} placeholder="https://..." />

                    <Text style={styles.label}>Gallery / Proof of Work (Up to 5 Images)</Text>
                    <TouchableOpacity style={styles.imagePickerButton} onPress={pickImages}>
                        <Text style={styles.imagePickerButtonText}>📷 Choose from Gallery</Text>
                    </TouchableOpacity>
                    {localImages.length > 0 && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnailContainer}>
                            {localImages.map((uri, idx) => (
                                <Image key={idx} source={{ uri }} style={styles.thumbnail} />
                            ))}
                        </ScrollView>
                    )}

                    <View style={styles.switchRow}>
                        <Text style={styles.label}>Make Profile Public</Text>
                        <Switch value={form.is_public} onValueChange={(val) => setForm({ ...form, is_public: val })} />
                    </View>

                    <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={isSaving}>
                        {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Visibility Profile</Text>}
                    </TouchableOpacity>
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAF9F6' },
    headerBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#2C3E50' },
    toggleContainer: { flexDirection: 'row', alignItems: 'center' },
    toggleLabel: { marginRight: 8, fontSize: 14, color: '#555' },

    // Form Styles
    formContainer: { flex: 1 },
    formContent: { padding: 16, maxWidth: 600, alignSelf: 'center', width: '100%', paddingBottom: 40 },
    instruction: { fontSize: 15, color: '#7F8C8D', marginBottom: 20, fontStyle: 'italic' },
    label: { fontSize: 14, fontWeight: '600', color: '#34495E', marginBottom: 6, marginTop: 12 },
    input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16 },
    textArea: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, minHeight: 80, textAlignVertical: 'top' },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 20, backgroundColor: '#fff', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
    saveButton: { backgroundColor: '#2C3E50', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    imagePickerButton: { backgroundColor: '#EAEDED', padding: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#ddd', marginBottom: 12 },
    imagePickerButtonText: { color: '#2C3E50', fontSize: 15, fontWeight: '600' },
    thumbnailContainer: { flexDirection: 'row', marginBottom: 16 },
    thumbnail: { width: 80, height: 80, borderRadius: 8, marginRight: 8, backgroundColor: '#eee' },

    // Preview Styles (Matches Geometric Design)
    previewContainer: { flex: 1, paddingBottom: 60 },
    heroContainer: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#ddd' },
    heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    identityCenter: { alignItems: 'center', marginTop: -60, paddingHorizontal: 20, zIndex: 10 },
    avatarRing: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 5 },
    avatar: { width: 110, height: 110, borderRadius: 55 },
    businessName: { fontSize: 26, fontWeight: '800', color: '#2C3E50', marginTop: 12, textAlign: 'center' },
    locationText: { fontSize: 15, color: '#7F8C8D', marginTop: 4 },
    section: { marginTop: 32, paddingHorizontal: 24, alignItems: 'center' },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: '#95A5A6', textTransform: 'uppercase', marginBottom: 12 },
    storyText: { fontSize: 16, fontStyle: 'italic', color: '#34495E', textAlign: 'center', lineHeight: 24 },
    sectionCard: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 24, borderRadius: 16, padding: 16, alignItems: 'center', elevation: 2 },
    listItem: { fontSize: 15, color: '#555', marginBottom: 6 },
    whatsappButtonPreview: { backgroundColor: '#25D366', marginHorizontal: 24, marginTop: 32, paddingVertical: 16, borderRadius: 30, alignItems: 'center' },
    whatsappButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
    galleryOrbit: { marginTop: 40, paddingLeft: 16 },
    galleryImage: { width: width * 0.7, height: 200, borderRadius: 12, marginRight: 16, backgroundColor: '#EAEDED' }
});
