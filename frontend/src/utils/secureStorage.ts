import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// The session token is a long-lived (7 day) bearer credential, so it belongs in
// the OS keychain/keystore (expo-secure-store), not plain AsyncStorage - a device
// backup or a rooted/jailbroken phone can read AsyncStorage's contents directly.
// SecureStore has no web implementation, so web falls back to AsyncStorage there.
const isWeb = Platform.OS === 'web';

export async function getSecureItem(key: string): Promise<string | null> {
  return isWeb ? AsyncStorage.getItem(key) : SecureStore.getItemAsync(key);
}

export async function setSecureItem(key: string, value: string): Promise<void> {
  return isWeb ? AsyncStorage.setItem(key, value) : SecureStore.setItemAsync(key, value);
}

export async function deleteSecureItem(key: string): Promise<void> {
  return isWeb ? AsyncStorage.removeItem(key) : SecureStore.deleteItemAsync(key);
}
