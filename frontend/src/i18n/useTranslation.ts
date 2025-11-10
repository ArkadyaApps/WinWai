import { useLanguageStore } from '../store/languageStore';
import { translations } from './translations';

export const useTranslation = () => {
  const { language } = useLanguageStore();
  
  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        // Fallback to English if translation not found
        value = translations.en;
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object') {
            value = value[fallbackKey];
          }
        }
        break;
      }
    }
    
    return typeof value === 'string' ? value : key;
  };
  
  return { t, language };
};
