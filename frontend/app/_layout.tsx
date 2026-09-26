import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/contexts/AuthContext';
import { usePwaInstallStore } from '../src/store/pwaInstallStore';
import { useLanguageStore } from '../src/store/languageStore';
import AlertHost from '../src/components/AlertHost';

export default function RootLayout() {
  const language = useLanguageStore((state) => state.language);

  useEffect(() => {
    usePwaInstallStore.getState().init();
    // Default is Thai; this swaps in the detected language (or the saved
    // choice) at startup so the landing page is right before anyone signs in.
    useLanguageStore.getState().initializeLanguage();
  }, []);

  // Keep <html lang> in step with the app language (accessibility, translation prompts).
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="admin" />
        </Stack>
        <AlertHost />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
