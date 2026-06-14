import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Button, Image, Keyboard, StyleSheet, Text, TextInput, View } from 'react-native';
import { createContinuityCapture, uploadMedia } from '../../services/mediaService';
import { useAuth } from '../../src/auth/AuthContext';

export default function ContinuityCaptureComposer({ onCapture }: { onCapture?: () => void }) {
    const { stewardId } = useAuth() as any;
    const [contextHint, setContextHint] = useState('');
    const [image, setImage] = useState<{ uri: string, filename: string, mimeType: string } | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handlePickImage = async () => {
        setError(null);
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            quality: 1,
        });
        if (!result.cancelled && result.uri) {
            const filename = result.uri.split('/').pop() || 'photo.jpg';
            setImage({
                uri: result.uri,
                filename,
                mimeType: 'image/jpeg',
            });
        }
    };

    const handleSave = async () => {
        if (!image) return;
        if (!stewardId) {
            setError('Steward identity not ready. Please sign in and complete your profile.');
            return;
        }

        setUploading(true);
        setError(null);
        setSuccess(false);
        try {
            // 1. Upload media
            const uploadRes = await uploadMedia(image.uri, image.filename, image.mimeType);
            // 2. Create continuity capture
            await createContinuityCapture({
                steward_id: stewardId,
                source_type: 'screenshot',
                raw_media_id: uploadRes.media_id,
                context_hint: contextHint.trim() || undefined,
            });
            setImage(null);
            setContextHint('');
            setSuccess(true);
            Keyboard.dismiss();
            if (onCapture) onCapture();
            setTimeout(() => setSuccess(false), 2000);
        } catch (e) {
            setError('Upload or capture failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Button title={image ? 'Change Image' : 'Pick Image/Photo'} onPress={handlePickImage} disabled={uploading} />
            {image && (
                <View style={{ alignItems: 'center', marginVertical: 12 }}>
                    <Image source={{ uri: image.uri }} style={{ width: 120, height: 120, borderRadius: 8 }} />
                </View>
            )}
            <TextInput
                style={styles.input}
                placeholder="Optional context hint (e.g. 'Payment proof screenshot')"
                value={contextHint}
                onChangeText={setContextHint}
                editable={!uploading}
                multiline
                returnKeyType="done"
                blurOnSubmit
            />
            <Button title={uploading ? 'Uploading...' : 'Save'} onPress={handleSave} disabled={uploading || !image} />
            {success && <Text style={styles.success}>Capture preserved.</Text>}
            {error && <Text style={styles.error}>{error}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { padding: 16, alignItems: 'stretch' },
    input: {
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        minHeight: 48,
        fontSize: 16,
        backgroundColor: '#fafafa',
    },
    error: { color: 'red', marginTop: 8, textAlign: 'center' },
    success: { color: '#2e7d32', marginTop: 8, textAlign: 'center' },
});
