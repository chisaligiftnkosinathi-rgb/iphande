import React from 'react';
import { Text, View } from 'react-native';
import type { ContinuityCapture } from '../../types/continuity';
import ContinuityCaptureCard from './ContinuityCaptureCard';

export default function ContinuityCaptureStream({ captures }: { captures: ContinuityCapture[] }) {
    if (captures.length === 0) {
        return (
            <View style={{ padding: 32, alignItems: 'center' }}>
                <Text style={{ color: '#aaa', textAlign: 'center', fontSize: 16 }}>
                    Nothing captured yet. Your gentle memories will appear here.
                </Text>
            </View>
        );
    }
    return (
        <View style={{ flex: 1, padding: 16 }}>
            {captures.map(capture => (
                <ContinuityCaptureCard key={capture.id} capture={capture} />
            ))}
        </View>
    );

    if (captures.length === 0) {
        return (
            <View style={{ padding: 32, alignItems: 'center' }}>
                <Text style={{ color: '#aaa', textAlign: 'center', fontSize: 16 }}>
                    Nothing captured yet. Your gentle memories will appear here.
                </Text>
            </View>
        );
    }
    return (
        <View style={{ flex: 1, padding: 16 }}>
            {captures.map(capture => (
                <ContinuityCaptureCard key={capture.id} capture={capture} />
            ))}
        </View>
    );
}
