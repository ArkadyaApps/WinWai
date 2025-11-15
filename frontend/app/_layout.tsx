import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import { interstitialAdManager } from '../src/managers/InterstitialAdManager.ts';

export default function RootLayout() {
  useEffect(() => {
    // Initialize interstitial ads on app start (native only)
    if (Platform.OS !== 'web') {
      interstitialAdManager.initialize();
    }
  }, []);

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="admin" />
      </Stack>
    </SafeAreaProvider>
  );
}
