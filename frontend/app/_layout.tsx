import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { AuthProvider } from '../src/contexts/AuthContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  useEffect(() => {
    // Only initialize AdMob on native platforms
    if (Platform.OS !== 'web') {
      const initializeAds = async () => {
        try {
          const mobileAds = require('react-native-google-mobile-ads').default;
          await mobileAds().initialize();
          console.log('Mobile Ads initialized');
        } catch (error) {
          console.error('Failed to initialize Mobile Ads', error);
        }
      };

      initializeAds();
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}