import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { detectCountryCode } from '../utils/locationService';
import { getLanguageFromCountry } from '../utils/translations';

type Language = 'en' | 'th' | 'fr' | 'ar';

// WinWai is a Thailand-first product: Thai unless we positively detect
// something else (or the user picks a language themselves).
const DEFAULT_LANGUAGE: Language = 'th';

interface LanguageState {
  language: Language;
  isLanguageDetected: boolean;
  setLanguage: (lang: Language) => Promise<void>;
  initializeLanguage: () => Promise<void>;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: DEFAULT_LANGUAGE,
  isLanguageDetected: false,
  setLanguage: async (language) => {
    await AsyncStorage.setItem('app_language', language);
    await AsyncStorage.setItem('language_manually_set', 'true');
    set({ language });
  },
  // Called once at app start (root layout), so the landing page is already in
  // the right language before anyone signs in.
  initializeLanguage: async () => {
    try {
      // An explicit choice always wins over detection.
      const manuallySet = await AsyncStorage.getItem('language_manually_set');
      const saved = (await AsyncStorage.getItem('app_language')) as Language | null;
      if (manuallySet === 'true' && saved) {
        set({ language: saved, isLanguageDetected: true });
        return;
      }

      // Country from the visitor's IP: no permission prompt (GPS would ask on
      // first paint) and enough for a default language. If it fails or times
      // out we stay on Thai (or the last auto-detected language).
      const countryCode = await detectCountryCode();
      if (countryCode) {
        const detected = getLanguageFromCountry(countryCode);
        await AsyncStorage.setItem('app_language', detected);
        set({ language: detected, isLanguageDetected: true });
        return;
      }

      set({ language: saved ?? DEFAULT_LANGUAGE, isLanguageDetected: true });
    } catch (error) {
      console.error('Failed to initialize language:', error);
      set({ language: DEFAULT_LANGUAGE, isLanguageDetected: true });
    }
  },
}));
