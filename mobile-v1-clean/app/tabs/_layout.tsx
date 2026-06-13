import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
    return (
        <Tabs screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: '#111827',
            tabBarInactiveTintColor: '#9CA3AF',
        }}>
            <Tabs.Screen
                name="home"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={24} color={color} />
                }}
            />
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Opportunities',
                    tabBarIcon: ({ color }) => <Ionicons name="megaphone-outline" size={24} color={color} />
                }}
            />
            <Tabs.Screen
                name="leads"
                options={{
                    title: 'Leads',
                    tabBarIcon: ({ color }) => <Ionicons name="mail-outline" size={24} color={color} />
                }}
            />
            <Tabs.Screen
                name="visibility"
                options={{
                    title: 'Visibility',
                    tabBarIcon: ({ color }) => <Ionicons name="eye-outline" size={24} color={color} />
                }}
            />
            <Tabs.Screen
                name="timeline"
                options={{
                    title: 'Timeline',
                    tabBarIcon: ({ color }) => <Ionicons name="time-outline" size={24} color={color} />
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={24} color={color} />
                }}
            />
        </Tabs>
    );
}
