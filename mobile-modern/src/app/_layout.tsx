import { Stack } from 'expo-router';
import { StewardProvider } from '../context/StewardContext';

export default function TabLayout() {
  return (
    <StewardProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F7F3EA' } }}>
        <Stack.Screen name="index" options={{ title: 'Welcome' }} />
        <Stack.Screen name="profile/visibility" options={{ title: 'My Visibility', presentation: 'modal' }} />
        <Stack.Screen name="opportunities/index" options={{ title: 'Opportunities' }} />
        <Stack.Screen name="auth/index" options={{ title: 'Sign In', presentation: 'modal' }} />
        <Stack.Screen name="onboarding/index" options={{ title: 'Onboarding', presentation: 'modal' }} />
        <Stack.Screen name="business/[slug]" options={{ title: 'Business Profile' }} />
      </Stack>
    </StewardProvider>
  );
}
