import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { buildApiUrl } from '../../src/config/api';

const { width } = Dimensions.get('window');

interface OpportunitySummary {
    id: string;
    title: string;
    archetype: string;
}

interface BusinessProfile {
    slug: string;
    name: string;
    steward_story: string;
    location_string: string;
    whatsapp_number: string | null;
    cover_photo_url: string | null;
    logo_url: string | null;
    supporting_images: string[];
    services: string[];
    opportunities: OpportunitySummary[];
}

export default function BusinessProfileScreen() {
    const { slug } = useLocalSearchParams<{ slug: string }>();
    const [profile, setProfile] = useState<BusinessProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // We can now use the real slug from the router!
                const response = await fetch(buildApiUrl(`public/business/${slug}`));
                if (response.ok) {
                    const data = await response.json();
                    setProfile(data);
                } else {
                    throw new Error("Not found, falling back to layout preview");
                }
            } catch (error) {
                // Fallback layout preview so the geometric design can be tested
                setProfile({
                    slug: (slug as string) || 'mandla-auto',
                    name: 'Mandla Auto Repairs',
                    location_string: 'Emalahleni, Mpumalanga',
                    steward_story: 'Serving the community with honest repairs and reliable service.',
                    whatsapp_number: '27820000000',
                    cover_photo_url: 'https://images.unsplash.com/photo-1486262715619-670810a07151?q=80&w=1000&auto=format&fit=crop',
                    logo_url: 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?q=80&w=200&auto=format&fit=crop',
                    supporting_images: [
                        'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?q=80&w=400&auto=format&fit=crop',
                        'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=400&auto=format&fit=crop'
                    ],
                    services: ['Vehicle Service', 'Brake Repairs', 'Engine Diagnostics'],
                    opportunities: [
                        { id: '1', title: 'Assistant Mechanic', archetype: 'work' },
                        { id: '2', title: 'Apprentice', archetype: 'training' }
                    ]
                });
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [slug]);

    const handleWhatsApp = () => {
        if (profile?.whatsapp_number) {
            const message = encodeURIComponent(`Hi ${profile.name}, I found your profile on iPhande...`);
            Linking.openURL(`https://wa.me/${profile.whatsapp_number}?text=${message}`);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#5D7A5A" />
            </View>
        );
    }

    if (!profile) return <Text style={styles.errorText}>Profile not found.</Text>;

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            {/* 1. HERO IMAGE (The Canopy) */}
            <View style={styles.heroContainer}>
                <Image
                    source={{ uri: profile.cover_photo_url || 'https://via.placeholder.com/800x400?text=No+Cover' }}
                    style={styles.heroImage}
                />
            </View>

            {/* 2. CENTRAL IDENTITY (The Human Core) */}
            <View style={styles.identityCenter}>
                <View style={styles.avatarRing}>
                    <Image
                        source={{ uri: profile.logo_url || 'https://via.placeholder.com/200?text=Logo' }}
                        style={styles.avatar}
                    />
                </View>
                <Text style={styles.businessName}>{profile.name}</Text>
                <Text style={styles.locationText}>📍 {profile.location_string}</Text>
            </View>

            {/* 3. TOP ORBIT: Story / Testimony */}
            <View style={styles.storyOrbit}>
                <Text style={styles.sectionTitle}>The Story</Text>
                <Text style={styles.storyText}>"{profile.steward_story}"</Text>
            </View>

            {/* 4. LEFT & RIGHT ORBITS: Services & Opportunities Grid */}
            <View style={styles.orbitGrid}>
                {/* Left Orbit: Work/Services */}
                <View style={styles.orbitCard}>
                    <View style={[styles.geometricBadge, { backgroundColor: '#E8DFD0' }]} />
                    <Text style={styles.orbitTitle}>Services</Text>
                    {profile.services.map((service, idx) => (
                        <Text key={idx} style={styles.orbitItem}>• {service}</Text>
                    ))}
                </View>

                {/* Right Orbit: Opportunities */}
                <View style={styles.orbitCard}>
                    <View style={[styles.geometricBadge, { backgroundColor: '#E8DFD0' }]} />
                    <Text style={styles.orbitTitle}>Opportunities</Text>
                    {profile.opportunities.map((opp) => (
                        <View key={opp.id} style={styles.opportunityPill}>
                            <Text style={styles.opportunityText}>{opp.title}</Text>
                            <Text style={styles.archetypeBadge}>{opp.archetype}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* 5. BOTTOM ORBIT: Contact CTA */}
            {profile.whatsapp_number && (
                <TouchableOpacity style={styles.whatsappButton} onPress={handleWhatsApp}>
                    <Text style={styles.whatsappButtonText}>💬 Connect on WhatsApp</Text>
                </TouchableOpacity>
            )}

            {/* 6. OUTER RING: Proof of Work / Supporting Images */}
            {profile.supporting_images.length > 0 && (
                <View style={styles.galleryOrbit}>
                    <Text style={styles.sectionTitle}>Proof of Work</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galleryScroll}>
                        {profile.supporting_images.map((img, idx) => (
                            <Image key={idx} source={{ uri: img }} style={styles.galleryImage} />
                        ))}
                    </ScrollView>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F7F3EA' },
    contentContainer: { paddingBottom: 60, maxWidth: 600, alignSelf: 'center', width: '100%' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: { textAlign: 'center', marginTop: 40, fontSize: 16, color: '#6F7D75' },

    // Hero
    heroContainer: { width: '100%', height: 200, backgroundColor: '#E8DFD0' },
    heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },

    // Identity Center
    identityCenter: { alignItems: 'center', marginTop: -60, paddingHorizontal: 20, zIndex: 10 },
    avatarRing: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#FFFDF8', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
    avatar: { width: 110, height: 110, borderRadius: 55 },
    businessName: { fontSize: 26, fontWeight: '800', color: '#24352F', marginTop: 12, textAlign: 'center', letterSpacing: 0.5 },
    locationText: { fontSize: 15, color: '#6F7D75', marginTop: 4, fontWeight: '500' },

    // Orbit Base
    sectionTitle: { fontSize: 14, fontWeight: '700', color: '#6F7D75', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12, textAlign: 'center' },

    // Top Orbit (Story)
    storyOrbit: { marginTop: 32, paddingHorizontal: 24, alignItems: 'center' },
    storyText: { fontSize: 16, fontStyle: 'italic', color: '#24352F', textAlign: 'center', lineHeight: 24 },

    // Middle Orbits (Grid)
    orbitGrid: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: 32, gap: 12 },
    orbitCard: { flex: 1, backgroundColor: '#FFFDF8', borderRadius: 16, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2, position: 'relative' },
    geometricBadge: { width: 40, height: 40, borderRadius: 20, position: 'absolute', top: -20, zIndex: 5 },
    orbitTitle: { fontSize: 18, fontWeight: '700', color: '#24352F', marginTop: 12, marginBottom: 12 },
    orbitItem: { fontSize: 15, color: '#6F7D75', marginBottom: 6, textAlign: 'center' },

    opportunityPill: { backgroundColor: '#FFFDF8', width: '100%', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginBottom: 8, alignItems: 'center', borderWidth: 1, borderColor: '#E8DFD0' },
    opportunityText: { fontSize: 14, fontWeight: '600', color: '#24352F', textAlign: 'center' },
    archetypeBadge: { fontSize: 10, color: '#5D7A5A', textTransform: 'uppercase', fontWeight: '800', marginTop: 4 },

    // Bottom Orbit (Contact)
    whatsappButton: { backgroundColor: '#25D366', marginHorizontal: 24, marginTop: 32, paddingVertical: 16, borderRadius: 30, alignItems: 'center', shadowColor: '#25D366', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    whatsappButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 18, letterSpacing: 0.5 },

    // Outer Ring (Gallery)
    galleryOrbit: { marginTop: 40, paddingLeft: 16, paddingBottom: 20 },
    galleryScroll: { paddingRight: 16 },
    galleryImage: { width: width * 0.7, height: 200, borderRadius: 12, marginRight: 16, backgroundColor: '#E8DFD0' }
});
