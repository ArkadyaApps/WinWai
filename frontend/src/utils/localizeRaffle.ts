import { Raffle } from '../types';
import { useLanguageStore } from '../store/languageStore';

/** The raffle's title/description in the viewer's language, falling back to the original text. */
export function localizeRaffle(raffle: Raffle, language: string): { title: string; description: string } {
  const translated = raffle.translations?.[language as keyof NonNullable<Raffle['translations']>];
  return {
    title: translated?.title?.trim() || raffle.title,
    description: translated?.description?.trim() || raffle.description,
  };
}

/** Hook form: re-renders when the display language changes. */
export function useLocalizedRaffle(raffle: Raffle): { title: string; description: string } {
  const language = useLanguageStore((s) => s.language);
  return localizeRaffle(raffle, language);
}
