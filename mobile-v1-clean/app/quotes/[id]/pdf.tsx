import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../../src/lib/supabase';
import { API_BASE_URL } from '../../../src/config/api';

export default function QuotePDFScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleDownloadAndShare = async () => {
        if (typeof id !== 'string') return;
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            if (!token) throw new Error("No auth token available");

            const fileUri = (FileSystem as any).documentDirectory + `Quote_IPH-${id.split('-')[0].toUpperCase()}.pdf`;
            
            const downloadRes = await (FileSystem as any).downloadAsync(
                `${API_BASE_URL}/documents/quotes/${id}/pdf`,
                fileUri,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (downloadRes.status !== 200) {
                 throw new Error("Could not download PDF from server");
            }

            const isSharingAvailable = await Sharing.isAvailableAsync();
            if (isSharingAvailable) {
                await Sharing.shareAsync(downloadRes.uri, { UTI: '.pdf', mimeType: 'application/pdf' });
            } else {
                Alert.alert("Sharing unavailable", "PDF generated successfully, but sharing is not supported on this device/browser.");
            }
        } catch (error: any) {
            console.error('Error generating PDF:', error);
            Alert.alert('Error', error.message || 'Could not generate the PDF.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Quote Document</Text>
                <Text style={styles.description}>
                    You can download and share the PDF document for this quote with your customer.
                </Text>

                <TouchableOpacity 
                    style={styles.primaryButton} 
                    onPress={handleDownloadAndShare}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.primaryButtonText}>Download & Share PDF</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.secondaryButton} 
                    onPress={() => router.back()}
                >
                    <Text style={styles.secondaryButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center' },
    content: { width: '80%', backgroundColor: '#FFFFFF', padding: 24, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' },
    title: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 12 },
    description: { fontSize: 15, color: '#4B5563', textAlign: 'center', marginBottom: 24, lineHeight: 22 },
    primaryButton: { backgroundColor: '#111827', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, width: '100%', alignItems: 'center', marginBottom: 12 },
    primaryButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
    secondaryButton: { backgroundColor: '#FFFFFF', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', width: '100%', alignItems: 'center' },
    secondaryButtonText: { color: '#111827', fontWeight: '700', fontSize: 16 },
});
