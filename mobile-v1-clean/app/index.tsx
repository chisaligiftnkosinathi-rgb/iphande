import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';

export default function SplashScreen() {
    const router = useRouter();
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        // Simulate system state readiness (auth resolution, graph hookup, etc.)
        const initSystem = async () => {
            await new Promise(resolve => setTimeout(resolve, 800));
            setIsReady(true);
        };
        initSystem();
    }, []);

    useEffect(() => {
        if (isReady) {
            router.replace('/public');
        }
    }, [isReady, router]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.center}>
                <Text style={styles.logo}>iPhande</Text>
                <Text style={styles.tagline}>Work that finds you</Text>
                <ActivityIndicator size="small" color="#111827" style={styles.loader} />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        fontSize: 48,
        fontWeight: '900',
        color: '#111827',
        letterSpacing: -1,
        marginBottom: 8,
    },
    tagline: {
        fontSize: 18,
        color: '#4B5563',
        fontWeight: '500',
    },
    loader: {
        marginTop: 32,
    }
});
