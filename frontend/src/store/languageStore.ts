import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

type Language = 'en' | 'th' | 'fr' | 'ar';

// WinWai is a Thailand-first product: the app opens in the phone's language when
// it is one we support (en/th/fr/ar), and in Thai otherwise. A language the user
// picks themselves always wins.
const DEFAULT_LANGUAGE: Language = 'th';
const SUPPORTED: Language[] = ['en', 'th', 'fr', 'ar'];

/** First supported language in the device's preference list ("fr-CA" -> fr), else Thai. */
export function detectDeviceLanguage(): Language {
  const tags: string[] = [];
  if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
    if (Array.isArray(navigator.languages)) tags.push(...navigator.languages);
    if (navigator.language) tags.push(navigator.language);
  }
  for (const tag of tags) {
    const primary = tag.toLowerCase().split('-')[0] as Language;
    if (SUPPORTED.includes(primary)) return primary;
  }
  return DEFAULT_LANGUAGE;
}

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

      // Follow the phone's language on every start (so changing the phone
      // language is picked up); unsupported languages fall back to Thai.
      const detected = detectDeviceLanguage();
      await AsyncStorage.setItem('app_language', detected);
      set({ language: detected, isLanguageDetected: true });
    } catch (error) {
      console.error('Failed to initialize language:', error);
      set({ language: DEFAULT_LANGUAGE, isLanguageDetected: true });
    }
  },
}));
