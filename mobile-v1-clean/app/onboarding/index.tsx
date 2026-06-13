import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { useSteward } from '../../src/context/StewardContext';
import { uploadProfileMedia } from '../../src/services/mediaUploadService';
import { updateMe } from '../../src/services/stewardApi';

const ARCHETYPES = [
    "Construction & Building",
    "Home Services (Plumber/Electrician)",
    "Mechanic & Auto Repair",
    "Hair, Beauty & Wellness",
    "Food & Catering",
    "Transport & Logistics",
    "Cleaning",
    "Creative & Events",
    "Digital Steward / Systems Builder",
    "Tutoring",
    "Funeral Cover & Insurance",
    "Real Estate & Property",
    "Sales & Commission Agents",
    "Church / Community Steward",
    "Other"
];

export default function OnboardingScreen() {
    const { user } = useAuth();
    const { profile, refreshProfile } = useSteward();
    const router = useRouter();

    const [businessName, setBusinessName] = useState('');
    const [archetype, setArchetype] = useState('');
    const [category, setCategory] = useState('');
    const [mainService, setMainService] = useState('');
    const [services, setServices] = useState('');
    const [shortBio, setShortBio] = useState('');
    const [location, setLocation] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [logoUri, setLogoUri] = useState<string | null>(null);
    const [coverUri, setCoverUri] = useState<string | null>(null);
    const [supportingImages, setSupportingImages] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [referralCode, setReferralCode] = useState('');

    useEffect(() => {
        if (!profile) return;

        setBusinessName(profile.name ?? "");
        setArchetype(profile.provider_type ?? "");
        setCategory(profile.business_category_key ?? "");
        setMainService(profile.business_line ?? "");
        setServices(profile.services ?? "");
        setShortBio(profile.short_bio ?? "");
        setLocation(profile.location ?? "");
        setWhatsapp(profile.phone ?? "");
        setLogoUri(profile.logo_url ?? null);
        setCoverUri(profile.cover_photo_url ?? null);
        setSupportingImages(Array.isArray(profile.supporting_image_urls) ? profile.supporting_image_urls : []);
    }, [profile]);

    const pickImage = async (type: 'logo' | 'cover') => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: type === 'logo' ? [1, 1] : [16, 9],
            quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
            if (type === 'logo') setLogoUri(result.assets[0].uri);
            else setCoverUri(result.assets[0].uri);
        }
    };

    const pickSupportingImage = async () => {
        if (supportingImages.length >= 5) {
            Alert.alert("Limit Reached", "You can only upload up to 5 proof-of-work images.");
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
            setSupportingImages([...supportingImages, result.assets[0].uri]);
        }
    };

    const removeSupportingImage = (index: number) => {
        setSupportingImages(supportingImages.filter((_, i) => i !== index));
    };

    const handleCompleteSetup = async () => {
        setErrorMessage('');

        if (!businessName.trim() || !whatsapp.trim() || !location.trim() || (!mainService.trim() && !services.trim())) {
            setErrorMessage("Please provide your Name, Location, WhatsApp, and at least one Service to continue.");
            return;
        }

        if (!user) {
            setErrorMessage("You must be logged in to complete setup.");
            return;
        }

        setLoading(true);

        // Format category to snake_case key (e.g. "Tech & Digital Services" -> "tech_digital_services")
        const formattedCategoryKey = category.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

        // Format WhatsApp number to start with 27 instead of 0
        let formattedWhatsapp = whatsapp.replace(/[^0-9]/g, '');
        if (formattedWhatsapp.startsWith('0')) {
            formattedWhatsapp = '27' + formattedWhatsapp.substring(1);
        }

        let finalLogoUrl = profile?.logo_url || null;
        let finalCoverUrl = profile?.cover_photo_url || null;
        let finalSupportingImages = [...supportingImages];

        try {
            // Upload images to Supabase if they are newly selected local URIs
            setUploadProgress('Uploading brand images...');
            if (logoUri && !logoUri.startsWith('http')) {
                finalLogoUrl = await uploadProfileMedia(user.id, logoUri, 'logo');
            }
            if (coverUri && !coverUri.startsWith('http')) {
                finalCoverUrl = await uploadProfileMedia(user.id, coverUri, 'cover');
            }

            for (let i = 0; i < finalSupportingImages.length; i++) {
                if (finalSupportingImages[i] && !finalSupportingImages[i].startsWith('http')) {
                    setUploadProgress(`Uploading proof image ${i + 1} of ${finalSupportingImages.length}...`);
                    finalSupportingImages[i] = await uploadProfileMedia(user.id, finalSupportingImages[i], 'gallery');
                }
            }
            setUploadProgress('Saving Profile...');

            console.log("FINAL MEDIA PAYLOAD", {
                finalLogoUrl,
                finalCoverUrl,
                finalSupportingImages,
            });

            await updateMe({
                name: businessName,
                provider_type: archetype,
                business_category_key: formattedCategoryKey,
                business_line: mainService,
                services,
                short_bio: shortBio,
                location,
                phone: formattedWhatsapp,
                contact_method: 'whatsapp',
                onboarding_completed: true,
                is_public: true,
                logo_url: finalLogoUrl ?? undefined,
                cover_photo_url: finalCoverUrl ?? undefined,
                supporting_image_urls: finalSupportingImages,
                referred_by_code: referralCode.trim() ? referralCode.trim() : undefined
            });

            await refreshProfile();

            // Always route to activation. The StewardGate will handle the final redirect.
            router.replace("/activation");
        } catch (error: any) {
            console.error("Onboarding Error:", error);
            setErrorMessage("Failed to save profile. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <Text style={styles.kicker}>Public Visibility</Text>
                <Text style={styles.title}>Build Your Steward Profile</Text>
                <Text style={styles.subtitle}>Your public profile helps people discover your work and contact you.</Text>
            </View>

            <View style={styles.form}>
                
                <View style={styles.sectionBlock}>
                    <Text style={styles.sectionTitle}>Identity</Text>
                    <Text style={styles.label}>Business or Stewardship Name *</Text>
                    <TextInput style={styles.input} placeholder="e.g. Makhado Construction" placeholderTextColor="#9CA3AF" value={businessName} onChangeText={setBusinessName} />
                    
                    <Text style={styles.label}>Logo / Profile Photo</Text>
                    <Text style={styles.helperText}>A clear, square image is preferred.</Text>
                    <TouchableOpacity style={styles.imagePickerButton} onPress={() => pickImage('logo')}>
                        <Text style={styles.imagePickerButtonText}>{logoUri ? "Change Logo" : "Choose Logo"}</Text>
                    </TouchableOpacity>
                    {logoUri ? <Image source={{ uri: logoUri }} style={styles.thumbnail} /> : null}

                    <Text style={styles.label}>Cover Photo</Text>
                    <Text style={styles.helperText}>A wide, landscape image is preferred.</Text>
                    <TouchableOpacity style={styles.imagePickerButton} onPress={() => pickImage('cover')}>
                        <Text style={styles.imagePickerButtonText}>{coverUri ? "Change Cover" : "Choose Cover Photo"}</Text>
                    </TouchableOpacity>
                    {coverUri ? <Image source={{ uri: coverUri }} style={styles.coverPreview} /> : null}
                </View>

                <View style={styles.sectionBlock}>
                    <Text style={styles.sectionTitle}>Services</Text>
                    <Text style={styles.label}>Select Your Archetype</Text>
                    <View style={styles.pillContainer}>
                        {ARCHETYPES.map((type) => (
                            <TouchableOpacity
                                key={type}
                                style={[styles.pill, archetype === type && styles.pillActive]}
                                onPress={() => setArchetype(type)}
                            >
                                <Text style={[styles.pillText, archetype === type && styles.pillTextActive]}>
                                    {type}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.label}>Specific Industry / Field</Text>
                    <TextInput style={styles.input} placeholder="e.g. Building & Maintenance" placeholderTextColor="#9CA3AF" value={category} onChangeText={setCategory} />

                    <Text style={styles.label}>Core Service *</Text>
                    <TextInput style={styles.input} placeholder="e.g. Roof repair and plumbing" placeholderTextColor="#9CA3AF" value={mainService} onChangeText={setMainService} />

                    <Text style={styles.label}>Service List (comma-separated)</Text>
                    <TextInput style={styles.input} placeholder="e.g. App Development, Website Design, IT Support" placeholderTextColor="#9CA3AF" value={services} onChangeText={setServices} />
                </View>

                <View style={styles.sectionBlock}>
                    <Text style={styles.sectionTitle}>Story</Text>
                    <Text style={styles.label}>The Story (Why you do what you do)</Text>
                    <Text style={styles.helperText}>Recommended. Share the heart behind your work.</Text>
                    <TextInput style={[styles.input, styles.textArea]} placeholder="Share the heart behind your work..." placeholderTextColor="#9CA3AF" value={shortBio} onChangeText={setShortBio} multiline numberOfLines={4} textAlignVertical="top" />
                </View>

                <View style={styles.sectionBlock}>
                    <Text style={styles.sectionTitle}>Contact & Area</Text>
                    <Text style={styles.label}>Location / Area *</Text>
                    <TextInput style={styles.input} placeholder="e.g. Klarinet, Emalahleni" placeholderTextColor="#9CA3AF" value={location} onChangeText={setLocation} />

                    <Text style={styles.label}>WhatsApp Number *</Text>
                    <TextInput style={styles.input} placeholder="e.g. 082 123 4567" placeholderTextColor="#9CA3AF" value={whatsapp} onChangeText={setWhatsapp} keyboardType="phone-pad" />
                </View>

                <View style={styles.sectionBlock}>
                    <Text style={styles.sectionTitle}>Proof of Work</Text>
                    <Text style={styles.label}>Gallery Images</Text>
                    <Text style={styles.helperText}>Recommended. Upload 1–5 clear images of your best work.</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galleryScroll}>
                        {supportingImages.map((uri, index) => (
                            <View key={index} style={styles.galleryImageContainer}>
                                <Image source={{ uri }} style={styles.galleryImage} />
                                <TouchableOpacity style={styles.removeImageBtn} onPress={() => removeSupportingImage(index)}>
                                    <Text style={styles.removeImageText}>✕</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                        {supportingImages.length < 5 && (
                            <TouchableOpacity style={styles.addGalleryBtn} onPress={pickSupportingImage}>
                                <Text style={styles.addGalleryText}>+ Add Photo</Text>
                            </TouchableOpacity>
                        )}
                    </ScrollView>
                </View>

                <View style={styles.sectionBlock}>
                    <Text style={styles.sectionTitle}>Referral Program</Text>
                    <Text style={styles.label}>Were you referred by a steward?</Text>
                    <Text style={styles.helperText}>If a friend invited you to iPhande, enter their code here.</Text>
                    <TextInput 
                        style={styles.input} 
                        placeholder="e.g. IPH-GLOB-A7B2" 
                        placeholderTextColor="#9CA3AF" 
                        value={referralCode} 
                        onChangeText={(t) => setReferralCode(t.toUpperCase())} 
                        autoCapitalize="characters"
                    />
                </View>

            </View>

            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

            <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={handleCompleteSetup}
                disabled={loading}
            >
                <Text style={styles.primaryButtonText}>
                    {loading ? (uploadProgress || "Saving Profile...") : "Complete Setup"}
                </Text>
            </TouchableOpacity>
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
        paddingBottom: 48,
    },
    header: {
        marginBottom: 32,
        marginTop: 24,
    },
    kicker: { fontSize: 12, fontWeight: '800', color: '#9CA3AF', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 },
    title: { fontSize: 32, fontWeight: '800', color: '#111827', marginBottom: 8 },
    subtitle: { fontSize: 16, color: '#6B7280', lineHeight: 24 },
    form: { gap: 24, marginBottom: 32 },
    sectionBlock: { backgroundColor: '#FFFFFF', padding: 24, borderRadius: 16, borderWidth: 1, borderColor: '#F3F4F6', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 16 },
    label: { fontSize: 14, fontWeight: '700', color: '#374151', marginTop: 12, marginBottom: 6 },
    helperText: { fontSize: 13, color: '#6B7280', marginBottom: 12 },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#111827',
    },
    textArea: { height: 120 },
    imagePickerButton: { backgroundColor: '#FFFFFF', padding: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 12, borderStyle: 'dashed' },
    imagePickerButtonText: { color: '#374151', fontSize: 14, fontWeight: '600' },
    thumbnail: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#E5E7EB', alignSelf: 'center', marginBottom: 16 },
    coverPreview: { width: '100%', height: 120, borderRadius: 8, backgroundColor: '#E5E7EB', marginBottom: 16 },
    galleryScroll: { flexDirection: 'row', marginBottom: 16 },
    galleryImageContainer: { marginRight: 12, position: 'relative' },
    galleryImage: { width: 100, height: 100, borderRadius: 8, backgroundColor: '#E5E7EB' },
    removeImageBtn: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.5)', width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    removeImageText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
    addGalleryBtn: { width: 100, height: 100, borderRadius: 8, borderWidth: 2, borderColor: '#E5E7EB', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB' },
    addGalleryText: { color: '#6B7280', fontSize: 12, fontWeight: '600', marginTop: 4 },
    pillContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    pill: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    pillActive: {
        backgroundColor: '#111827',
        borderColor: '#111827',
    },
    pillText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4B5563',
    },
    pillTextActive: {
        color: '#FFFFFF',
    },
    errorText: {
        color: '#DC2626',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 16,
        textAlign: 'center',
    },
    primaryButton: {
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#111827',
        alignItems: 'center',
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 16,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
});
