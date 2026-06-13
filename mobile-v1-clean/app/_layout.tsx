import { Stack } from 'expo-router';
import { StewardGate } from '../src/components/StewardGate';
import { AuthProvider } from '../src/context/AuthContext';
import { StewardProvider } from '../src/context/StewardContext';

export default function RootLayout() {
    return (
        <AuthProvider>
            <StewardProvider>
                <StewardGate>
                    <Stack>
                        {/* The Outer Gate */}
                        <Stack.Screen name="index" options={{ headerShown: false }} />
                        <Stack.Screen name="auth/register" options={{ headerShown: false }} />
                        <Stack.Screen name="auth/login" options={{ headerShown: false }} />
                        <Stack.Screen name="activation/index" options={{ headerShown: false }} />
                        <Stack.Screen name="onboarding/index" options={{ title: 'Business Setup' }} />

                        {/* The Main River (5 Tabs) */}
                        <Stack.Screen name="tabs" options={{ headerShown: false }} />

                        {/* Steward Tools (Now handled by nested layout with headerShown: false) */}
                        <Stack.Screen name="tools" options={{ headerShown: false, presentation: 'modal' }} />
                        <Stack.Screen name="expenses" options={{ headerShown: false }} />

                        {/* Admin & Account Settings */}
                        <Stack.Screen name="admin/payments" options={{ headerShown: false }} />
                        <Stack.Screen name="profile/settings" options={{ headerShown: false }} />

                        {/* Public Ecosystem */}
                        <Stack.Screen name="public/[slug]" options={{ headerShown: false }} />

                        {/* Quotes Ecosystem */}
                        <Stack.Screen name="quotes/index" options={{ headerShown: false }} />
                        <Stack.Screen name="quotes/new" options={{ headerShown: false, presentation: 'modal' }} />
                        <Stack.Screen name="quotes/[id]" options={{ headerShown: false }} />

                        {/* Jobs Ecosystem */}
                        <Stack.Screen name="jobs/[id]/proof" options={{ headerShown: false }} />

                        {/* Support Ecosystem */}
                        <Stack.Screen name="support/index" options={{ headerShown: false }} />
                        <Stack.Screen name="support/giving" options={{ headerShown: false }} />
                        <Stack.Screen name="legal/index" options={{ headerShown: false }} />
                        <Stack.Screen name="legal/privacy" options={{ headerShown: false }} />
                        <Stack.Screen name="legal/acknowledgements" options={{ headerShown: false }} />
                    </Stack>
                </StewardGate>
            </StewardProvider>
        </AuthProvider>
    );
}
