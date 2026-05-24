import ContentGeneratorScreen from './screens/ContentGeneratorScreen';
import GivingSupportScreen from './screens/GivingSupportScreen';
import QuoteRequestFormScreen from './screens/QuoteRequestFormScreen';
import QuoteRequestsScreen from './screens/QuoteRequestsScreen';

import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';

import { navigationRef, RootTabParamList } from './navigation';


import CampaignsScreen from './screens/CampaignsScreen';
import HomeScreen from './screens/HomeScreen';
import LocationScreen from './screens/LocationScreen';
import MediaScreen from './screens/MediaScreen';
import MessageTemplatesScreen from './screens/MessageTemplatesScreen';
import MoreScreen from './screens/MoreScreen';
import OpportunitiesScreen from './screens/OpportunitiesScreen';
import ProfileScreen from './screens/ProfileScreen';
import QuoteRequestsDashboardScreen from './screens/QuoteRequestsDashboardScreen';
import ReflectionsScreen from './screens/ReflectionsScreen';
import { EntityReplayScreen } from './screens/EntityReplayScreen';
import { GraphReplayScreen } from './screens/GraphReplayScreen';
import { ReplayEventDetailScreen } from './screens/ReplayEventDetailScreen';
import { ReplayTimelineScreen } from './screens/ReplayTimelineScreen';
import ScriptureReflectionsScreen from './screens/ScriptureReflectionsScreen';
import StewardshipLedgerScreen from './screens/StewardshipLedgerScreen';

const Tab = createBottomTabNavigator<RootTabParamList>();

const getTabIcon = (
  routeName: keyof RootTabParamList,
  focused: boolean,
  color: string,
  size: number
) => {
  const icons: Record<keyof RootTabParamList, keyof typeof Ionicons.glyphMap> = {
    Home: focused ? 'home' : 'home-outline',
    Opportunities: focused ? 'briefcase' : 'briefcase-outline',
    Timeline: focused ? 'time' : 'time-outline',
    ReplayEventDetail: 'git-branch-outline',
    EntityReplay: 'analytics-outline',
    GraphReplay: 'git-network-outline',
    More: focused ? 'grid' : 'grid-outline',
    Profile: focused ? 'person' : 'person-outline',
    Campaigns: focused ? 'megaphone' : 'megaphone-outline',
    Media: focused ? 'images' : 'images-outline',
    Location: focused ? 'location' : 'location-outline',
    Reflections: focused ? 'journal' : 'journal-outline',
    Scripture: focused ? 'book' : 'book-outline',
    Templates: focused ? 'document-text' : 'document-text-outline',
    QuoteRequestForm: 'mail',
    QuoteRequestsDashboard: 'list',
    ContentGenerator: 'flash-outline',
    QuoteRequests: 'mail-outline',
    GivingSupport: 'heart-outline',
    StewardshipLedger: 'wallet-outline',
  };
  return <Ionicons name={icons[routeName]} size={size} color={color} />;
};

export default function App() {
  return (
    <NavigationContainer ref={navigationRef}>
      <Tab.Navigator
        initialRouteName="Home"
        screenOptions={({ route }) => ({
          headerStyle: {
            backgroundColor: '#F8FAF7',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: '#E5E7EB',
          },
          headerTitleStyle: {
            fontSize: 34,
            fontWeight: '900',
            color: '#102A20',
          },
          headerTitleAlign: 'left',
          tabBarIcon: ({ focused, color, size }) =>
            getTabIcon(route.name, focused, color, size),
          tabBarActiveTintColor: '#1E3A2F',
          tabBarInactiveTintColor: '#9CA3AF',
          tabBarStyle: {
            height: 78,
            paddingBottom: 12,
            paddingTop: 8,
            backgroundColor: '#FFFFFF',
            borderTopColor: '#E5E7EB',
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '800',
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Timeline" component={ReplayTimelineScreen} options={{ title: 'Replay' }} />
        <Tab.Screen name="Opportunities" component={OpportunitiesScreen} />
        <Tab.Screen name="More" component={MoreScreen} />

        {/* Hidden screens for navigation only */}
        <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }} />
        <Tab.Screen name="Campaigns" component={CampaignsScreen} options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }} />
        <Tab.Screen name="Media" component={MediaScreen} options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }} />
        <Tab.Screen name="Location" component={LocationScreen} options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }} />
        <Tab.Screen name="Reflections" component={ReflectionsScreen} options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }} />
        <Tab.Screen name="Scripture" component={ScriptureReflectionsScreen} options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }} />
        <Tab.Screen name="Templates" component={MessageTemplatesScreen} options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }} />
        <Tab.Screen name="QuoteRequestForm" component={QuoteRequestFormScreen} options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }} />
        <Tab.Screen name="QuoteRequestsDashboard" component={QuoteRequestsDashboardScreen} options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }} />
        <Tab.Screen name="ContentGenerator" component={ContentGeneratorScreen} options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }} />
        <Tab.Screen name="QuoteRequests" component={QuoteRequestsScreen} options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }} />
        <Tab.Screen name="GivingSupport" component={GivingSupportScreen} options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }} />
        <Tab.Screen name="StewardshipLedger" component={StewardshipLedgerScreen} options={{ title: 'Stewardship', tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }} />
        <Tab.Screen name="ReplayEventDetail" component={ReplayEventDetailScreen} options={{ title: 'Event Inspection', tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }} />
        <Tab.Screen name="EntityReplay" component={EntityReplayScreen} options={{ title: 'Entity Replay', tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }} />
        <Tab.Screen name="GraphReplay" component={GraphReplayScreen} options={{ title: 'Causal Graph', tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
