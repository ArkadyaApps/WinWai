import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Language = 'en' | 'th' | 'fr';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  initializeLanguage: () => Promise<void>;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: 'en',
  setLanguage: async (language) => {
    await AsyncStorage.setItem('app_language', language);
    set({ language });
  },
  initializeLanguage: async () => {
    try {
      const saved = await AsyncStorage.getItem('app_language');
      if (saved) {
        set({ language: saved as Language });
      }
    } catch (error) {
      console.error('Failed to load language:', error);
    }
  },
}));