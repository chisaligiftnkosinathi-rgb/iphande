import React from 'react';
import { Image, Text, View } from 'react-native';
import type { ContinuityCapture } from '../../types/continuity';

// Placeholder continuity card surface
export default function ContinuityCaptureCard({ capture }: { capture: ContinuityCapture }) {
    const mediaUrl = capture.raw_media_id ? `/api/v1/media/${capture.raw_media_id}` : undefined;
    return (
        <View style={{ marginVertical: 8, padding: 16, borderRadius: 8, backgroundColor: '#f7f7f7', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 }}>
            {mediaUrl && (
                <Image source={{ uri: mediaUrl }} style={{ width: 120, height: 120, borderRadius: 8, marginBottom: 8 }} />
            )}
            <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>{capture.raw_text || capture.context_hint || '[No text]'}</Text>
            <Text style={{ color: '#666', fontSize: 12 }}>Source: {capture.source_type}</Text>
            {capture.status && <Text style={{ color: '#aaa', fontSize: 12 }}>Status: {capture.status}</Text>}
            <Text style={{ color: '#bbb', fontSize: 10, marginTop: 4 }}>{new Date(capture.created_at).toLocaleString()}</Text>
        </View>
    );
}
