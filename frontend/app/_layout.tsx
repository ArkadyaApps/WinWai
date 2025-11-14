import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { AuthProvider } from '../src/contexts/AuthContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from '../src/theme/ThemeProvider';
import { useLanguageStore } from '../src/store/languageStore';

export default function RootLayout() {
  const { initializeLanguage } = useLanguageStore();

  useEffect(() => {
    console.log('WinWai app initialized on', Platform.OS);
    
    // Initialize language based on geolocation
    initializeLanguage();

    // Initialize Google Mobile Ads on native platforms
    if (Platform.OS !== 'web') {
      const initializeAdMob = async () => {
        try {
          const { default: mobileAds } = await import('react-native-google-mobile-ads');
          await mobileAds().initialize();
          console.log('AdMob initialized successfully');
        } catch (error) {
          console.log('AdMob initialization skipped:', error);
        }
      };
      initializeAdMob();
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="signup" />
            <Stack.Screen name="forgot-password" />
            <Stack.Screen name="reset-password" />
            <Stack.Screen name="admin" />
            <Stack.Screen name="raffle/[id]" />
            <Stack.Screen name="voucher/[id]" />
          </Stack>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
