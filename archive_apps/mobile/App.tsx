
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';


import { getScreensForArchetype } from './data/archetypeScreenAccess';
import AuthScreen from './screens/AuthScreen';
import EmailVerificationScreen from './screens/EmailVerificationScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import { AuthProvider, useAuth } from './src/auth/AuthContext';
import { StewardMediaProvider } from './src/features/steward-media/StewardMediaContext';


import { navigationRef, RootStackParamList, RootTabParamList } from './navigation';
import AboutUsScreen from './screens/AboutUsScreen';
import AcknowledgementsScreen from './screens/AcknowledgementsScreen';
import ContinuityPrinciplesScreen from './screens/ContinuityPrinciplesScreen';
import DocumentComposerScreen from './screens/DocumentComposerScreen';
import HomeScreen from './screens/HomeScreen';
import MediaIngestionScreen from './screens/MediaIngestionScreen';
import MoreScreen from './screens/MoreScreen';
import MusicScreen from './screens/MusicScreen';
import OpportunitiesScreen from './screens/OpportunitiesScreen';
import { ReplayTimelineScreen } from './screens/ReplayTimelineScreen';
import SupportScreen from './screens/SupportScreen';

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const getTabIcon = (
  routeName: keyof RootTabParamList,
  focused: boolean,
  color: string,
  size: number
) => {
  const icons: Record<keyof RootTabParamList, keyof typeof Ionicons.glyphMap> = {
    ContinuityHome: focused ? 'compass' : 'compass-outline',
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
    PaymentReview: 'receipt-outline',
    LeadQuoteCapture: 'create-outline',
    InventoryLedger: 'cube-outline',
    InventoryReplay: 'git-branch-outline',
    CommissionLedger: 'cash-outline',
    ContinuityInbox: 'infinite-outline',
  };
  return <Ionicons name={icons[routeName]} size={size} color={color} />;
};


function GovernedTabs() {
  const { selectedBusinessArchetypeKey } = useAuth();
  // Only show tabs for allowed screens for this archetype
  const rawAllowedScreens = getScreensForArchetype(selectedBusinessArchetypeKey || '');
  const allowedScreens = Array.from(new Set(rawAllowedScreens));
  // Define valid tab names as keyof RootTabParamList
  const validTabNames = [
    'Home',
    'Opportunities',
    'Timeline',
    'More',
  ] as const;
  // Filter allowedScreens to only valid tab names
  const dynamicTabs = allowedScreens.filter((screen): screen is typeof validTabNames[number] =>
    (validTabNames as readonly string[]).includes(screen)
  );

  // Enforce Home and More are always present as bookends
  const filteredTabs = Array.from(new Set(['Home', ...dynamicTabs, 'More'])) as typeof validTabNames[number][];

  // Map route name to component
  const screenComponents: Record<typeof validTabNames[number], any> = {
    Home: HomeScreen,
    Timeline: ReplayTimelineScreen,
    Opportunities: OpportunitiesScreen,
    More: MoreScreen,
  };
  return (
    <Tab.Navigator
      initialRouteName={filteredTabs[0] || 'Home'}
      screenOptions={({ route }: { route: any }) => ({
        headerShown: false,
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
        tabBarIcon: ({ focused, color, size }: { focused: boolean, color: string, size: number }) =>
          getTabIcon(route.name as keyof RootTabParamList, focused, color, size),
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
      {filteredTabs.map((screen) => {
        const Comp = screenComponents[screen];
        if (!Comp) return null;
        return <Tab.Screen key={screen} name={screen} component={Comp} />;
      })}
    </Tab.Navigator>
  );
}

function AuthenticatedStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AuthenticatedTabs" component={GovernedTabs} />
      <Stack.Group screenOptions={{ presentation: 'modal' }}>
        <Stack.Screen name="DocumentComposer" component={DocumentComposerScreen} />
        <Stack.Screen name="MediaIngestion" component={MediaIngestionScreen} />
      </Stack.Group>
      <Stack.Screen name="AboutUs" component={AboutUsScreen} />
      <Stack.Screen name="Acknowledgements" component={AcknowledgementsScreen} />
      <Stack.Screen name="Music" component={MusicScreen} />
      <Stack.Screen name="ContinuityPrinciples" component={ContinuityPrinciplesScreen} />
      <Stack.Screen name="Support" component={SupportScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StewardMediaProvider>
        <NavigationContainer ref={navigationRef}>
          <AuthFlowRouter />
        </NavigationContainer>
      </StewardMediaProvider>
    </AuthProvider>
  );
}

function AuthFlowRouter() {
  const { isAuthenticated, isOnboarded, emailVerified, refreshUser, signOut } = useAuth();
  if (!isAuthenticated) return <AuthScreen />;
  if (!emailVerified) return <EmailVerificationScreen onRefresh={refreshUser} />;
  if (!isOnboarded) return <OnboardingScreen />;
  return <AuthenticatedStack />;
}
