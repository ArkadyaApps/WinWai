import type { APIRoute } from "astro";
import { z } from "zod";
import { getDb } from "../../../../lib/db/client";
import { requireAdmin } from "../../../../lib/auth";
import { json, handleError } from "../../../../lib/respond";
import { RAFFLE_LANGUAGES, translateRaffleTexts } from "../../../../lib/translate";

const TranslateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  sourceLanguage: z.enum(RAFFLE_LANGUAGES),
});

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = locals.runtime.env;
    const db = getDb(env);
    await requireAdmin(db, request);

    if (!env.AI) return json({ error: "Translation service is not configured" }, 503);

    const parsed = TranslateSchema.safeParse(await request.json());
    if (!parsed.success) return json({ error: parsed.error.issues[0].message }, 400);
    const { title, description, sourceLanguage } = parsed.data;

    const { translations, failed } = await translateRaffleTexts(env.AI, { title, description }, sourceLanguage);
    if (Object.keys(translations).length === 0) return json({ error: "Translation failed, please try again" }, 502);
    return json({ translations, failed });
  } catch (e) {
    return handleError(e);
  }
};
