import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserLocation } from '../utils/locationService';

type Language = 'en' | 'th' | 'fr' | 'ar';

interface LanguageState {
  language: Language;
  isLanguageDetected: boolean;
  setLanguage: (lang: Language) => Promise<void>;
  initializeLanguage: () => Promise<void>;
}

// Map country codes to languages
const getLanguageFromCountryCode = (countryCode: string): Language => {
  const languageMap: { [key: string]: Language } = {
    'TH': 'th', // Thailand -> Thai
    'FR': 'fr', // France -> French
    'BE': 'fr', // Belgium -> French (can be refined)
    'CH': 'fr', // Switzerland -> French (can be refined)
    'CA': 'fr', // Canada -> French (can be refined for Quebec)
  };
  
  return languageMap[countryCode] || 'en'; // Default to English
};

export const useLanguageStore = create<LanguageState>((set) => ({
  language: 'en',
  isLanguageDetected: false,
  setLanguage: async (language) => {
    await AsyncStorage.setItem('app_language', language);
    await AsyncStorage.setItem('language_manually_set', 'true');
    set({ language });
  },
  initializeLanguage: async () => {
    try {
      // First check if user has manually set a language preference
      const manuallySet = await AsyncStorage.getItem('language_manually_set');
      const saved = await AsyncStorage.getItem('app_language');
      
      if (manuallySet === 'true' && saved) {
        // User has manually set language, use their preference
        set({ language: saved as Language, isLanguageDetected: true });
        return;
      }
      
      // Try to detect language from geolocation
      try {
        const location = await getUserLocation();
        if (location && location.countryCode) {
          const detectedLanguage = getLanguageFromCountryCode(location.countryCode);
          console.log(`Detected country: ${location.country} (${location.countryCode}), setting language to: ${detectedLanguage}`);
          
          // Save detected language
          await AsyncStorage.setItem('app_language', detectedLanguage);
          set({ language: detectedLanguage, isLanguageDetected: true });
          return;
        }
      } catch (geoError) {
        console.error('Geolocation-based language detection failed:', geoError);
      }
      
      // Fallback: Use saved language or default to English
      if (saved) {
        set({ language: saved as Language, isLanguageDetected: true });
      } else {
        set({ language: 'en', isLanguageDetected: true });
      }
    } catch (error) {
      console.error('Failed to initialize language:', error);
      set({ language: 'en', isLanguageDetected: true });
    }
  },
}));