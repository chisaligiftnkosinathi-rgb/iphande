import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
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
import { buildApiUrl } from '../../config/api';
import { useSteward } from '../../context/StewardContext';
import { uploadProofOfWorkImage } from '../../services/mediaUploadService';

const { width } = Dimensions.get('window');

const resolveMediaUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('file') || url.startsWith('data')) return url;
    return buildApiUrl(url);
};

export default function VisibilityProfileEditor() {
    const { steward, isAuthenticated, user } = useSteward();
    const router = useRouter();

    const [isPreview, setIsPreview] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    // Mobile state for picked image URIs
    const [localImages, setLocalImages] = useState<
        { uri: string; base64?: string; fileName?: string; mimeType?: string }[]
    >([]);
    const [selectedLogo, setSelectedLogo] = useState<{ uri: string; base64?: string; fileName?: string; mimeType?: string } | null>(null);
    const [selectedCover, setSelectedCover] = useState<{ uri: string; base64?: string; fileName?: string; mimeType?: string } | null>(null);

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

    const handleNameChange = (text: string) => {
        const autoSlug = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        setForm({ ...form, name: text, slug: autoSlug });
    };

    const handleSave = async () => {
        console.log('[VISIBILITY] Save button pressed');
        console.log('[VISIBILITY] steward', steward);
        console.log('[VISIBILITY] ownerId', user?.uid);
        console.log('[VISIBILITY] profileId', steward?.profileId);

        if (!user?.uid) {
            Alert.alert('Authentication Required', 'Please sign in before making your profile visible.');
            return;
        }

        if (!steward?.profileId) {
            Alert.alert('Profile Required', 'Complete onboarding first so a profile record can be created.');
            return;
        }

        setIsSaving(true);
        try {
            // Step 1: Upload any newly selected local images
            console.log('[VISIBILITY] Uploading gallery');
            const uploadedImageUrls: string[] = [];
            for (const image of localImages) {
                if (!image.base64) {
                    throw new Error('Selected image is missing base64 data. Please select it again.');
                }

                const publicUrl = await uploadProofOfWorkImage({
                    base64Data: image.base64,
                    ownerId: user.uid,
                    profileId: steward.profileId,
                    folder: 'gallery',
                    fileName: image.fileName,
                    contentType: image.mimeType,
                });

                uploadedImageUrls.push(publicUrl);
            }

            // Step 2: Merge new public URLs with any existing ones
            const existingUrls = (form.supporting_image_urls || '')
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);
            const finalSupportingUrls = [...existingUrls, ...uploadedImageUrls].join(',');

            let finalLogoUrl = form.logo_url;
            let finalCoverUrl = form.cover_photo_url;

            if (selectedLogo?.base64) {
                console.log('[VISIBILITY] Uploading logo');
                finalLogoUrl = await uploadProofOfWorkImage({
                    base64Data: selectedLogo.base64,
                    ownerId: user.uid,
                    profileId: steward.profileId,
                    folder: 'logo',
                    fileName: selectedLogo.fileName,
                    contentType: selectedLogo.mimeType,
                });
            }

            if (selectedCover?.base64) {
                console.log('[VISIBILITY] Uploading cover');
                finalCoverUrl = await uploadProofOfWorkImage({
                    base64Data: selectedCover.base64,
                    ownerId: user.uid,
                    profileId: steward.profileId,
                    folder: 'cover',
                    fileName: selectedCover.fileName,
                    contentType: selectedCover.mimeType,
                });
            }

            const payload = {
                ...form,
                logo_url: finalLogoUrl,
                cover_photo_url: finalCoverUrl,
                supporting_image_urls: finalSupportingUrls,
            };

            const apiUrl = buildApiUrl(`profiles/${steward.profileId}/visibility`);
            console.log('[PATCH PAYLOAD]', payload);
            console.log('[PATCH URL]', apiUrl);

            const response = await fetch(apiUrl, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            console.log('profile update response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to update visibility profile: ${response.status} ${errorText}`);
            }
            console.log('profile update response OK');

            // Synchronize the local view by replacing form with the newly saved URLs
            setForm(payload);
            setLocalImages([]);
            setSelectedLogo(null);
            setSelectedCover(null);

            Alert.alert('Success', 'Your visibility profile has been updated!');
        } catch (error: any) {
            console.error('Error during handleSave:', error);
            Alert.alert('Save Failed', error.message || 'An unexpected error occurred while saving.');
        } finally {
            setIsSaving(false);
            console.log('--- handleSave finished ---');
        }
    };

    const pickImages = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: true,
            selectionLimit: 5,
            quality: 0.8,
            base64: true,
        });

        if (!result.canceled) {
            setLocalImages(
                result.assets.slice(0, 5).map((asset) => ({
                    uri: asset.uri,
                    base64: asset.base64 || undefined,
                    fileName: asset.fileName || `proof-${Date.now()}.jpg`,
                    mimeType: asset.mimeType || 'image/jpeg',
                }))
            );
        }
    };

    const pickSingleImage = async (
        target: 'logo' | 'cover'
    ) => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: false,
            quality: 0.8,
            base64: true,
        });

        if (!result.canceled) {
            const asset = result.assets[0];
            const image = {
                uri: asset.uri,
                base64: asset.base64 || undefined,
                fileName: asset.fileName || `${target}-${Date.now()}.jpg`,
                mimeType: asset.mimeType || 'image/jpeg',
            };

            if (target === 'logo') {
                setSelectedLogo(image);
                setForm((prev) => ({ ...prev, logo_url: image.uri }));
            } else {
                setSelectedCover(image);
                setForm((prev) => ({ ...prev, cover_photo_url: image.uri }));
            }
        }
    };

    const renderPreview = () => {
        const locationString = [form.suburb, form.city, form.province].filter(Boolean).join(', ') || 'Location not set';
        const servicesList = (form.services || '').split(',').map(s => s.trim()).filter(Boolean);
        const imagesList = localImages.length > 0
            ? localImages.map((image) => image.uri)
            : (form.supporting_image_urls || '')
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);

        return (
            <ScrollView style={styles.previewContainer}>
                {/* Hero Canopy */}
                <View style={styles.heroContainer}>
                    <Image source={{ uri: resolveMediaUrl(form.cover_photo_url) || 'https://placehold.co/800x400/E8DFD0/6F7D75/png?text=No+Cover' }} style={styles.heroImage} resizeMode="cover" />
                </View>

                {/* Identity Core */}
                <View style={styles.identityCenter}>
                    <View style={styles.avatarRing}>
                        <Image source={{ uri: resolveMediaUrl(form.logo_url) || 'https://placehold.co/200x200/E8DFD0/6F7D75/png?text=Logo' }} style={styles.avatar} />
                    </View>
                    <Text style={styles.businessName}>{form.name || 'Business Name'}</Text>
                    <Text style={styles.locationText}>📍 {locationString}</Text>
                </View>

                {/* Story */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>The Story</Text>
                    <Text style={styles.storyText}>"{form.short_bio || 'Your story goes here...'}"</Text>
                </View>

                {/* Continuity Evidence (Vision Placeholder) */}
                <View style={[styles.sectionCard, { backgroundColor: '#F7F3EA', borderColor: '#E8DFD0', borderWidth: 1, elevation: 0 }]}>
                    <Text style={styles.sectionTitle}>Continuity Evidence</Text>
                    <Text style={[styles.listItem, { color: '#5D7A5A', fontWeight: '600' }]}>✓ Serving {form.suburb || 'the community'} since 2022</Text>
                    <Text style={[styles.listItem, { color: '#5D7A5A', fontWeight: '600' }]}>✓ 127 vehicles serviced</Text>
                    <Text style={[styles.listItem, { color: '#5D7A5A', fontWeight: '600' }]}>✓ 23 community testimonials</Text>
                    <Text style={[styles.listItem, { color: '#5D7A5A', fontWeight: '600' }]}>✓ Last completed: Suzuki Ertiga brake replacement</Text>
                    <Text style={[styles.listItem, { color: '#5D7A5A', fontWeight: '600', marginBottom: 0 }]}>✓ Most requested: Brake Repairs</Text>
                </View>

                {/* Services Orbit */}
                {servicesList.length > 0 && (
                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>Services</Text>
                        {servicesList.map((service, idx) => <Text key={idx} style={styles.listItem}>✓ {service}</Text>)}
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
                                <Image key={idx} source={{ uri: resolveMediaUrl(img) }} style={styles.galleryImage} />
                            ))}
                        </ScrollView>
                    </View>
                )}
            </ScrollView>
        );
    };

    if (!isAuthenticated) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
                <Text style={[styles.headerTitle, { textAlign: 'center', marginBottom: 16 }]}>Please sign in to view your visibility profile.</Text>
                <TouchableOpacity style={styles.saveButton} onPress={() => router.push('/auth')}>
                    <Text style={styles.saveButtonText}>Sign In as Steward</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (steward && steward.setup_fee_status && ['pending', 'pending_review'].includes(steward.setup_fee_status)) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
                <Text style={[styles.headerTitle, { textAlign: 'center', marginBottom: 16 }]}>Registration Pending Review</Text>
                <Text style={{ fontSize: 16, color: '#6F7D75', textAlign: 'center', marginBottom: 24, lineHeight: 24 }}>
                    Your business registration and R120 setup fee are currently being reviewed by an administrator.
                    {'\n\n'}Your visibility tools will unlock as soon as your payment is verified.
                </Text>
                <TouchableOpacity style={styles.saveButton} onPress={() => router.replace('/')}>
                    <Text style={styles.saveButtonText}>Return to Home</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.headerBar}>
                <Text style={styles.headerTitle}>My Visibility</Text>
                <View style={styles.toggleContainer}>
                    <Text style={styles.toggleLabel}>Preview</Text>
                    <Switch value={isPreview} onValueChange={setIsPreview} />
                </View>
            </View>

            {isPreview ? (
                renderPreview()
            ) : (
                <ScrollView style={styles.formContainer} contentContainerStyle={styles.formContent}>
                    <View style={styles.welcomeBanner}>
                        <Text style={styles.welcomeTitle}>Your work matters.</Text>
                        <Text style={styles.welcomeSubtitle}>Let's help people find it.</Text>
                    </View>

                    {/* 1. IDENTITY */}
                    <View style={styles.formGroup}>
                        <Text style={styles.groupTitle}>Identity</Text>
                        <Text style={styles.label}>Business Name</Text>
                        <TextInput style={styles.input} value={form.name} onChangeText={handleNameChange} placeholder="Mandla Auto Repairs" />

                        <Text style={styles.label}>Profile Link (Slug)</Text>
                        <TextInput style={styles.input} value={form.slug} onChangeText={(t) => setForm({ ...form, slug: t })} placeholder="mandla-auto" autoCapitalize="none" />

                        <Text style={styles.label}>Logo / Profile Photo</Text>
                        <TouchableOpacity style={styles.imagePickerButton} onPress={() => pickSingleImage('logo')}>
                            <Text style={styles.imagePickerButtonText}>Choose Logo / Profile Photo</Text>
                        </TouchableOpacity>
                        {form.logo_url ? <Image source={{ uri: form.logo_url }} style={styles.thumbnail} /> : null}

                        <Text style={styles.label}>Cover Photo</Text>
                        <TouchableOpacity style={styles.imagePickerButton} onPress={() => pickSingleImage('cover')}>
                            <Text style={styles.imagePickerButtonText}>Choose Cover Photo</Text>
                        </TouchableOpacity>
                        {form.cover_photo_url ? <Image source={{ uri: form.cover_photo_url }} style={styles.coverPreview} /> : null}
                    </View>

                    {/* 2. STORY */}
                    <View style={styles.formGroup}>
                        <Text style={styles.groupTitle}>Story</Text>
                        <Text style={styles.label}>Why do you do what you do?</Text>
                        <TextInput style={styles.textArea} value={form.short_bio} onChangeText={(t) => setForm({ ...form, short_bio: t })} placeholder="Share the heart behind your work..." multiline />
                    </View>

                    {/* 3. LOCATION & CONTACT */}
                    <View style={styles.formGroup}>
                        <Text style={styles.groupTitle}>Location & Contact</Text>
                        <Text style={styles.label}>WhatsApp Number</Text>
                        <TextInput style={styles.input} value={form.whatsapp_number} onChangeText={(t) => setForm({ ...form, whatsapp_number: t })} placeholder="27710000000" keyboardType="phone-pad" />

                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 8 }}>
                                <Text style={styles.label}>Province</Text>
                                <TextInput style={styles.input} value={form.province} onChangeText={(t) => setForm({ ...form, province: t })} placeholder="Mpumalanga" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>City</Text>
                                <TextInput style={styles.input} value={form.city} onChangeText={(t) => setForm({ ...form, city: t })} placeholder="Emalahleni" />
                            </View>
                        </View>
                        <Text style={styles.label}>Suburb</Text>
                        <TextInput style={styles.input} value={form.suburb} onChangeText={(t) => setForm({ ...form, suburb: t })} placeholder="Klarinet" />
                    </View>

                    {/* 4. SERVICES */}
                    <View style={styles.formGroup}>
                        <Text style={styles.groupTitle}>Services</Text>
                        <Text style={styles.label}>What can you help people with? (Comma separated)</Text>
                        <TextInput style={styles.input} value={form.services} onChangeText={(t) => setForm({ ...form, services: t })} placeholder="Vehicle Service, Brake Repairs, Diagnostics" />
                    </View>

                    {/* 5. PROOF OF WORK */}
                    <View style={styles.formGroup}>
                        <Text style={styles.groupTitle}>Proof of Work</Text>
                        <Text style={styles.label}>Photos of work / Proof of service</Text>
                        <TouchableOpacity style={styles.imagePickerButton} onPress={pickImages}>
                            <Text style={styles.imagePickerButtonText}>📷 Choose from Gallery</Text>
                        </TouchableOpacity>
                        {localImages.length > 0 && (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnailContainer}>
                                {localImages.map((image, idx) => (
                                    <Image key={idx} source={{ uri: image.uri }} style={styles.thumbnail} />
                                ))}
                            </ScrollView>
                        )}
                    </View>

                    {/* 6. VISIBILITY */}
                    <View style={styles.switchRow}>
                        <Text style={styles.label}>Publish Profile</Text>
                        <Switch value={form.is_public} onValueChange={(val) => setForm({ ...form, is_public: val })} />
                    </View>

                    <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={isSaving}>
                        {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Preserve & Make Visible</Text>}
                    </TouchableOpacity>
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F7F3EA' },
    headerBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#FFFDF8', borderBottomWidth: 1, borderColor: '#eee' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#24352F' },
    toggleContainer: { flexDirection: 'row', alignItems: 'center' },
    toggleLabel: { marginRight: 8, fontSize: 14, color: '#555' },

    // Form Styles
    formContainer: { flex: 1 },
    formContent: { padding: 16, maxWidth: 600, alignSelf: 'center', width: '100%', paddingBottom: 40 },
    welcomeBanner: { marginBottom: 24, paddingVertical: 16, borderLeftWidth: 4, borderColor: '#24352F', paddingLeft: 16, backgroundColor: '#FFFDF8', borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    welcomeTitle: { fontSize: 18, fontWeight: 'bold', color: '#24352F', marginBottom: 4 },
    welcomeSubtitle: { fontSize: 15, color: '#6F7D75', fontStyle: 'italic' },
    formGroup: { marginBottom: 24, backgroundColor: '#FFFDF8', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E8DFD0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
    groupTitle: { fontSize: 18, fontWeight: '700', color: '#24352F', marginBottom: 12, letterSpacing: 0.5 },
    label: { fontSize: 14, fontWeight: '600', color: '#24352F', marginBottom: 6, marginTop: 8 },
    input: { backgroundColor: '#FFFDF8', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16 },
    textArea: { backgroundColor: '#FFFDF8', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, minHeight: 80, textAlignVertical: 'top' },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 20, backgroundColor: '#FFFDF8', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
    saveButton: { backgroundColor: '#24352F', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    imagePickerButton: { backgroundColor: '#E8DFD0', padding: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#ddd', marginBottom: 12 },
    imagePickerButtonText: { color: '#24352F', fontSize: 15, fontWeight: '600' },
    thumbnailContainer: { flexDirection: 'row', marginBottom: 16 },
    thumbnail: { width: 80, height: 80, borderRadius: 8, marginRight: 8, backgroundColor: '#eee' },
    coverPreview: {
        width: '100%',
        aspectRatio: 16 / 9,
        borderRadius: 8,
        marginTop: 8,
        backgroundColor: '#eee',
    },

    // Preview Styles (Matches Geometric Design)
    previewContainer: { flex: 1, paddingBottom: 60 },
    heroContainer: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#ddd' },
    heroImage: { width: '100%', height: '100%' },
    identityCenter: { alignItems: 'center', marginTop: -60, paddingHorizontal: 20, zIndex: 10 },
    avatarRing: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#FFFDF8', justifyContent: 'center', alignItems: 'center', elevation: 5 },
    avatar: { width: 110, height: 110, borderRadius: 55 },
    businessName: { fontSize: 26, fontWeight: '800', color: '#24352F', marginTop: 12, textAlign: 'center' },
    locationText: { fontSize: 15, color: '#6F7D75', marginTop: 4 },
    section: { marginTop: 32, paddingHorizontal: 24, alignItems: 'center' },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: '#95A5A6', textTransform: 'uppercase', marginBottom: 12 },
    storyText: { fontSize: 16, fontStyle: 'italic', color: '#24352F', textAlign: 'center', lineHeight: 24 },
    sectionCard: { backgroundColor: '#FFFDF8', marginHorizontal: 16, marginTop: 24, borderRadius: 16, padding: 16, alignItems: 'center', elevation: 2 },
    listItem: { fontSize: 15, color: '#555', marginBottom: 6 },
    whatsappButtonPreview: { backgroundColor: '#25D366', marginHorizontal: 24, marginTop: 32, paddingVertical: 16, borderRadius: 30, alignItems: 'center' },
    whatsappButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
    galleryOrbit: { marginTop: 40, paddingLeft: 16 },
    galleryImage: { width: width * 0.7, height: 200, borderRadius: 12, marginRight: 16, backgroundColor: '#E8DFD0' }
});
