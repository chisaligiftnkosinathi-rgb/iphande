import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { buildApiUrl } from '../../config/api';
import { fetchPublicProfile } from '../../services/apiClient';
import { Profile } from '../../types/api';

const { width } = Dimensions.get('window');

const resolveMediaUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('file') || url.startsWith('data')) return url;
    return buildApiUrl(url);
};

export default function PublicBusinessPage() {
    const { slug } = useLocalSearchParams<{ slug: string }>();
    const router = useRouter();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!slug) return;
        fetchPublicProfile(slug)
            .then(setProfile)
            .catch((err) => setError(err.message || 'Profile not found'))
            .finally(() => setLoading(false));
    }, [slug]);

    if (loading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color="#24352F" />
            </View>
        );
    }

    if (error || !profile) {
        return (
            <View style={[styles.container, styles.centered]}>
                <Text style={styles.errorText}>{error || 'Profile not found'}</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const locationString = [profile.suburb, profile.city, profile.province].filter(Boolean).join(', ') || 'Location not set';
    const servicesList = (profile.services || '').split(',').map((s: string) => s.trim()).filter(Boolean);
    const imagesList = (profile.supporting_image_urls || '').split(',').map((s: string) => s.trim()).filter(Boolean);

    const handleWhatsApp = () => {
        if (profile.whatsapp_number) {
            // Clean number for WhatsApp formatting
            const phone = profile.whatsapp_number.replace(/\D/g, '');
            Linking.openURL(`https://wa.me/${phone}`);
        }
    };

    const handleRequestQuote = () => {
        Alert.alert('Coming Soon', 'The Quote Request feature is the final step in our V1 flow!');
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
            {/* 1. Cover Photo */}
            <View style={styles.heroContainer}>
                <Image source={{ uri: resolveMediaUrl(profile.cover_photo_url || '') || 'https://placehold.co/800x400/E8DFD0/6F7D75/png?text=No+Cover' }} style={styles.heroImage} resizeMode="cover" />
            </View>

            {/* 2. Logo & 3. Business Name & 4. Location */}
            <View style={styles.identityCenter}>
                <View style={styles.avatarRing}>
                    <Image source={{ uri: resolveMediaUrl(profile.logo_url || '') || 'https://placehold.co/200x200/E8DFD0/6F7D75/png?text=Logo' }} style={styles.avatar} />
                </View>
                <Text style={styles.businessName}>{profile.name}</Text>
                <Text style={styles.locationText}>📍 {locationString}</Text>
            </View>

            {/* 7. WhatsApp & 9. Quote Buttons */}
            <View style={styles.actionRow}>
                {profile.whatsapp_number ? (
                    <TouchableOpacity style={[styles.actionButton, styles.whatsappBtn]} onPress={handleWhatsApp}>
                        <Text style={styles.whatsappBtnText}>💬 WhatsApp</Text>
                    </TouchableOpacity>
                ) : null}
                <TouchableOpacity style={[styles.actionButton, styles.quoteBtn]} onPress={handleRequestQuote}>
                    <Text style={styles.quoteBtnText}>📋 Request Quote</Text>
                </TouchableOpacity>
            </View>

            {/* 5. Story */}
            {profile.short_bio && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>The Story</Text>
                    <Text style={styles.storyText}>"{profile.short_bio}"</Text>
                </View>
            )}

            {/* 6. Services */}
            {servicesList.length > 0 && (
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Services</Text>
                    {servicesList.map((service: string, idx: number) => <Text key={idx} style={styles.listItem}>✓ {service}</Text>)}
                </View>
            )}

            {/* 8. Proof of Work Gallery */}
            {imagesList.length > 0 && (
                <View style={styles.galleryOrbit}>
                    <Text style={styles.sectionTitle}>Proof of Work</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {imagesList.map((img: string, idx: number) => (
                            <Image key={idx} source={{ uri: resolveMediaUrl(img) }} style={styles.galleryImage} />
                        ))}
                    </ScrollView>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F7F3EA' },
    centered: { justifyContent: 'center', alignItems: 'center', padding: 24 },
    errorText: { fontSize: 16, color: '#e74c3c', marginBottom: 16, textAlign: 'center' },
    backButton: { backgroundColor: '#24352F', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
    backButtonText: { color: '#fff', fontWeight: 'bold' },

    heroContainer: { width: '100%', height: 200, backgroundColor: '#ddd' },
    heroImage: { width: '100%', height: '100%' },

    identityCenter: { alignItems: 'center', marginTop: -60, paddingHorizontal: 20, zIndex: 10 },
    avatarRing: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#FFFDF8', justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    avatar: { width: 110, height: 110, borderRadius: 55 },
    businessName: { fontSize: 26, fontWeight: '800', color: '#24352F', marginTop: 12, textAlign: 'center' },
    locationText: { fontSize: 15, color: '#6F7D75', marginTop: 4 },

    actionRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24, paddingHorizontal: 16, gap: 12 },
    actionButton: { flex: 1, maxWidth: 200, paddingVertical: 14, borderRadius: 8, alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
    whatsappBtn: { backgroundColor: '#25D366' },
    whatsappBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    quoteBtn: { backgroundColor: '#24352F' },
    quoteBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

    section: { marginTop: 32, paddingHorizontal: 24, alignItems: 'center' },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: '#95A5A6', textTransform: 'uppercase', marginBottom: 12 },
    storyText: { fontSize: 16, fontStyle: 'italic', color: '#24352F', textAlign: 'center', lineHeight: 24 },

    sectionCard: { backgroundColor: '#FFFDF8', marginHorizontal: 16, marginTop: 24, borderRadius: 16, padding: 16, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
    listItem: { fontSize: 15, color: '#555', marginBottom: 6 },

    galleryOrbit: { marginTop: 40, paddingLeft: 16, marginBottom: 20 },
    galleryImage: { width: width * 0.7, height: 200, borderRadius: 12, marginRight: 16, backgroundColor: '#E8DFD0' }
});
