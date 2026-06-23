import { Stack } from 'expo-router';
import { StewardProvider } from '../context/StewardContext';

export default function RootLayout() {
  return (
    <StewardProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F7F3EA' } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="explore" options={{ title: 'Explore' }} />
        <Stack.Screen name="auth" options={{ title: 'Sign In', presentation: 'modal' }} />
        <Stack.Screen name="onboarding" options={{ title: 'Register', presentation: 'modal' }} />
        <Stack.Screen name="profile/visibility" options={{ title: 'My Visibility' }} />
        <Stack.Screen name="leads/capture" options={{ title: 'Capture Lead' }} />
      </Stack>
    </StewardProvider>
  );
}
