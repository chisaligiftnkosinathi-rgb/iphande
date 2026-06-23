import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, SafeAreaView, ScrollView, Text, View } from 'react-native';
import ContinuityCaptureComposer from '../components/continuity/ContinuityCaptureComposer';
import ContinuityCaptureStream from '../components/continuity/ContinuityCaptureStream';
import { AppHeader } from '../components/ui/AppHeader';
import { listCaptures } from '../services/continuityCaptureService';
import { useAuth } from '../src/auth/AuthContext';
import type { ContinuityCapture } from '../types/continuity';

export default function ContinuityInboxScreen() {
    const { stewardId } = useAuth() as any;
    const [captures, setCaptures] = useState<ContinuityCapture[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    const loadCaptures = useCallback(() => {
        if (!stewardId) {
            setLoading(false);
            return;
        }
        setRefreshing(true);
        listCaptures(stewardId)
            .then(setCaptures)
            .catch(() => setCaptures([]))
            .finally(() => {
                setRefreshing(false);
                setLoading(false);
            });
    }, [stewardId]);

    useEffect(() => {
        loadCaptures();
    }, [loadCaptures]);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <AppHeader title="Continuity Inbox" />
            <View style={{ flex: 1, paddingTop: 16 }}>
                <ContinuityCaptureComposer onCapture={loadCaptures} />
                {loading ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator size="large" color="#aaa" />
                        <Text style={{ color: '#aaa', marginTop: 16 }}>Loading your gentle memories...</Text>
                    </View>
                ) : (
                    <ScrollView
                        style={{ flex: 1 }}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadCaptures} />}>
                        <ContinuityCaptureStream captures={captures} />
                    </ScrollView>
                )}
            </View>
        </SafeAreaView>
    );
}
