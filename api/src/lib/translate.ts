// Raffle text translation with Cloudflare Workers AI (M2M100). Runs only when an
// admin presses "Auto-translate" while editing a raffle - never per visitor -
// and the result is stored on the raffle so the admin can review and edit it.
export const RAFFLE_LANGUAGES = ["en", "th", "fr", "ar"] as const;
export type RaffleLanguage = (typeof RAFFLE_LANGUAGES)[number];

export type RaffleTextTranslations = Partial<Record<RaffleLanguage, { title: string; description: string }>>;

/** The part of the Workers AI binding this module uses (keeps it mockable in tests). */
export interface TranslationAi {
  run(model: string, input: { text: string; source_lang: string; target_lang: string }): Promise<{ translated_text?: string }>;
}

export const TRANSLATION_MODEL = "@cf/meta/m2m100-1.2b";

async function translateText(ai: TranslationAi, text: string, from: RaffleLanguage, to: RaffleLanguage): Promise<string> {
  const result = await ai.run(TRANSLATION_MODEL, { text, source_lang: from, target_lang: to });
  const translated = result.translated_text?.trim();
  if (!translated) throw new Error("Empty translation");
  return translated;
}

/**
 * Translates a raffle's title and description from `from` into every other
 * supported language. One failing language doesn't sink the rest: it is
 * reported in `failed` and left out of `translations`.
 */
export async function translateRaffleTexts(
  ai: TranslationAi,
  source: { title: string; description: string },
  from: RaffleLanguage
): Promise<{ translations: RaffleTextTranslations; failed: RaffleLanguage[] }> {
  const targets = RAFFLE_LANGUAGES.filter((l) => l !== from);
  const settled = await Promise.allSettled(
    targets.map(async (to) => ({
      to,
      title: await translateText(ai, source.title, from, to),
      description: await translateText(ai, source.description, from, to),
    }))
  );

  const translations: RaffleTextTranslations = {};
  const failed: RaffleLanguage[] = [];
  settled.forEach((result, i) => {
    if (result.status === "fulfilled") translations[result.value.to] = { title: result.value.title, description: result.value.description };
    else failed.push(targets[i]);
  });
  return { translations, failed };
}
