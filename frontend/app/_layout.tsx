import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import { AuthProvider } from '../src/contexts/AuthContext';

export default function RootLayout() {
  useEffect(() => {
    // Initialize AdMob on app start (native only)
    if (Platform.OS !== 'web') {
      initializeAdMob();
    }
  }, []);

  const initializeAdMob = async () => {
    try {
      console.log('🚀 Initializing AdMob...');
      const mobileAds = await import('react-native-google-mobile-ads');
      await mobileAds.default().initialize();
      console.log('✅ AdMob initialized successfully');
      
      // Optional: Set request configuration
      await mobileAds.default().setRequestConfiguration({
        maxAdContentRating: mobileAds.MaxAdContentRating.G,
        tagForChildDirectedTreatment: false,
        tagForUnderAgeOfConsent: false,
      });
      console.log('✅ AdMob request configuration set');
    } catch (error) {
      console.error('❌ Failed to initialize AdMob:', error);
    }
  };

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="admin" />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
