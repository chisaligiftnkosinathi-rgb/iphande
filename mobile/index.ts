import 'react-native-gesture-handler';

import { registerRootComponent } from 'expo';

import App from './App';

/**
 * iPhande Mobile Bootstrap
 *
 * - Registers the root application
 * - Ensures Expo Go and native builds initialize consistently
 * - Prepares runtime for navigation + gesture handling
 */

registerRootComponent(App);
