import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'phanda_auth_token';

export const storage = {
  getToken: async (): Promise<string | null> => {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined') {
          return window.localStorage.getItem(TOKEN_KEY);
        }
      } catch (e) {
        console.error('Failed to get token on web', e);
      }
      return null;
    }
    
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (e) {
      console.error('Failed to get token securely', e);
      return null;
    }
  },

  setToken: async (token: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(TOKEN_KEY, token);
        }
      } catch (e) {
        console.error('Failed to set token on web', e);
      }
      return;
    }
    
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch (e) {
      console.error('Failed to save token securely', e);
    }
  },

  removeToken: async (): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(TOKEN_KEY);
        }
      } catch (e) {
        console.error('Failed to remove token on web', e);
      }
      return;
    }
    
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch (e) {
      console.error('Failed to delete token securely', e);
    }
  },
};
