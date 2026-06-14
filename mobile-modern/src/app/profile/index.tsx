import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { auth } from '../../config/firebase';
import { useSteward } from '../../context/StewardContext';
import { createProfile } from '../../services/apiClient';
import { uploadProofOfWorkImage } from '../../services/mediaUploadService';

export default function RegisterBusinessScreen() {
    const router = useRouter();
    const { signUp, completeOnboarding, user, isAuthenticated } = useSteward();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [form, setForm] = useState({
        businessName: '',
        email: user?.email || '',
        password: '',
        archetype: '',
    });

    const [slipImage, setSlipImage] = useState<{ uri: string; base64?: string; fileName?: string; mimeType?: string } | null>(null);

    const pickSlipImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: false,
            quality: 0.8,
            base64: true,
        });

        if (!result.canceled) {
            const asset = result.assets[0];
            setSlipImage({
                uri: asset.uri,
                base64: asset.base64 || undefined,
                fileName: asset.fileName || `slip-${Date.now()}.jpg`,
                mimeType: asset.mimeType || 'image/jpeg',
            });
        }
    };

    const handleRegister = async () => {
        if (!isAuthenticated) {
            if (!form.businessName || !form.email || !form.password) {
                Alert.alert('Missing Fields', 'Please fill in your business name, email, and password.');
                return;
            }
        } else if (!form.businessName) {
            Alert.alert('Missing Fields', 'Please provide your business name.');
            return;
        }

        if (!slipImage || !slipImage.base64) {
            Alert.alert('Proof Required', 'Please upload your R120 setup fee EFT slip to register.');
            return;
        }

        setIsSubmitting(true);
        try {
            let uid = user?.uid;
            if (!isAuthenticated || !uid) {
                // 1. Create Firebase User
                await signUp(form.email, form.password);

                // Use synchronous auth state to grab the UID immediately after signup
                uid = auth?.currentUser?.uid;
                if (!uid) throw new Error('Authentication failed. Could not retrieve your secure identity.');
            }

            // 2. Upload EFT Slip to Supabase (using 'registration' as a temporary profile folder until one exists)
            const slipUrl = await uploadProofOfWorkImage({
                base64Data: slipImage.base64,
                ownerId: uid,
                profileId: 'registration',
                folder: 'payments',
                fileName: slipImage.fileName,
                contentType: slipImage.mimeType,
            });

            // 3. Create Railway Profile with payment status
            const profile = await createProfile({
                name: form.businessName,
                slug: form.businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
                email: form.email || user?.email || '',
                owner_id: uid,
                business_category_key: form.archetype || 'general',
                setup_fee_required: 120.0,
                setup_fee_status: 'pending_review',
                setup_fee_proof_url: slipUrl,
            });

            // 4. Update local StewardContext memory
            if (completeOnboarding) {
                await completeOnboarding(profile.id, profile.business_category_key || 'general', profile.name);
            }

            Alert.alert('Registration Submitted', 'Your business has been registered and is pending fee review.', [
                { text: 'Continue to Visibility', onPress: () => router.replace('/profile/visibility') }
            ]);
        } catch (error: any) {
            console.error('Registration error:', error);
            Alert.alert('Registration Failed', error.message || 'An error occurred during registration.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.card}>
                <Text style={styles.title}>Register Business</Text>
                <Text style={styles.subtitle}>Join iPhande and build your digital reputation.</Text>

                <Text style={styles.label}>Business Name</Text>
                <TextInput style={styles.input} value={form.businessName} onChangeText={(t) => setForm({ ...form, businessName: t })} placeholder="Mandla Auto Repairs" />

                <Text style={styles.label}>Business Archetype</Text>
                <TextInput style={styles.input} value={form.archetype} onChangeText={(t) => setForm({ ...form, archetype: t })} placeholder="e.g. automotive, catering, funeral" autoCapitalize="none" />

                {!isAuthenticated && (
                    <>
                        <Text style={styles.label}>Email Address</Text>
                        <TextInput style={styles.input} value={form.email} onChangeText={(t) => setForm({ ...form, email: t })} placeholder="mandla@example.com" autoCapitalize="none" keyboardType="email-address" />

                        <Text style={styles.label}>Password</Text>
                        <TextInput style={styles.input} value={form.password} onChangeText={(t) => setForm({ ...form, password: t })} placeholder="••••••••" secureTextEntry />
                    </>
                )}

                <View style={styles.feeBox}>
                    <Text style={styles.feeText}>Admin Setup Fee: R120.00</Text>
                    <Text style={[styles.feeText, { fontSize: 12, marginTop: 4, color: '#6F7D75' }]}>Please EFT your setup fee and upload the proof of payment slip below to finalize your registration.</Text>
                </View>

                <TouchableOpacity style={styles.imagePickerButton} onPress={pickSlipImage}>
                    <Text style={styles.imagePickerButtonText}>{slipImage ? 'Change EFT Slip' : 'Upload Proof of Payment'}</Text>
                </TouchableOpacity>
                {slipImage && <Image source={{ uri: slipImage.uri }} style={styles.slipPreview} />}

                <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={isSubmitting}>
                    {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Submit Registration</Text>}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.replace('/auth')}>
                    <Text style={styles.linkText}>Already registered? Sign In</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flexGrow: 1, backgroundColor: '#F7F3EA', padding: 20, justifyContent: 'center' },
    card: { backgroundColor: '#FFFDF8', padding: 24, borderRadius: 12, borderWidth: 1, borderColor: '#E8DFD0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#24352F', marginBottom: 8, textAlign: 'center' },
    subtitle: { fontSize: 14, color: '#6F7D75', marginBottom: 24, textAlign: 'center' },
    label: { fontSize: 14, fontWeight: '600', color: '#24352F', marginBottom: 6, marginTop: 12 },
    input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16 },
    button: { backgroundColor: '#24352F', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 24 },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    linkText: { color: '#24352F', fontSize: 14, textAlign: 'center', marginTop: 16, textDecorationLine: 'underline' },
    imagePickerButton: { backgroundColor: '#E8DFD0', padding: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#ddd', marginTop: 12 },
    imagePickerButtonText: { color: '#24352F', fontSize: 15, fontWeight: '600' },
    slipPreview: { width: '100%', height: 150, borderRadius: 8, marginTop: 12, backgroundColor: '#eee' },
    feeBox: { backgroundColor: '#F0EBE1', padding: 12, borderRadius: 8, marginTop: 16, borderWidth: 1, borderColor: '#E8DFD0' },
    feeText: { fontSize: 14, color: '#24352F', fontWeight: '500' }
});
