import { describe, expect, it } from "vitest";
import { TranslationAi, translateRaffleTexts } from "./translate";

const fakeAi = (fail: string[] = []): TranslationAi => ({
  async run(_model, { text, source_lang, target_lang }) {
    if (fail.includes(target_lang)) throw new Error("boom");
    return { translated_text: `[${source_lang}>${target_lang}] ${text}` };
  },
});

describe("translateRaffleTexts", () => {
  it("translates title and description into every other language", async () => {
    const { translations, failed } = await translateRaffleTexts(fakeAi(), { title: "Free pizza", description: "Win a pizza" }, "en");
    expect(failed).toEqual([]);
    expect(Object.keys(translations).sort()).toEqual(["ar", "fr", "th"]);
    expect(translations.th).toEqual({ title: "[en>th] Free pizza", description: "[en>th] Win a pizza" });
  });

  it("never re-translates the source language", async () => {
    const { translations } = await translateRaffleTexts(fakeAi(), { title: "พิซซ่าฟรี", description: "ลุ้นพิซซ่า" }, "th");
    expect(translations.th).toBeUndefined();
    expect(translations.en?.title).toBe("[th>en] พิซซ่าฟรี");
  });

  it("reports a failing language without losing the others", async () => {
    const { translations, failed } = await translateRaffleTexts(fakeAi(["fr"]), { title: "A", description: "B" }, "en");
    expect(failed).toEqual(["fr"]);
    expect(Object.keys(translations).sort()).toEqual(["ar", "th"]);
  });

  it("treats an empty translation as a failure", async () => {
    const ai: TranslationAi = { run: async () => ({ translated_text: "  " }) };
    const { translations, failed } = await translateRaffleTexts(ai, { title: "A", description: "B" }, "en");
    expect(translations).toEqual({});
    expect(failed.sort()).toEqual(["ar", "fr", "th"]);
  });
});
