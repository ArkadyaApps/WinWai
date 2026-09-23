import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";
import { getDb } from "../../../lib/db/client";
import { entries, partners, raffles, rewards, users, vouchers } from "../../../db/schema";
import { requireAdmin } from "../../../lib/auth";
import { json, handleError } from "../../../lib/respond";
import { DrawWinnerSchema } from "../../../lib/validations/raffle";
import { drawRandom, generateVerificationCode, generateVoucherReference } from "../../../lib/raffleHelpers";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = getDb(locals.runtime.env);
    await requireAdmin(db, request);

    const parsed = DrawWinnerSchema.safeParse(await request.json());
    if (!parsed.success) return json({ error: "raffleId required" }, 400);
    const { raffleId } = parsed.data;

    const raffle = await db.query.raffles.findFirst({ where: eq(raffles.id, raffleId) });
    if (!raffle) return json({ error: "Raffle not found" }, 404);

    const partner = raffle.partnerId ? await db.query.partners.findFirst({ where: eq(partners.id, raffle.partnerId) }) : null;

    const raffleEntries = await db.select().from(entries).where(eq(entries.raffleId, raffleId)).limit(10000);
    if (raffleEntries.length === 0) return json({ error: "No entries for this raffle" }, 400);

    const prizesToAward = Math.min(raffle.prizesRemaining, raffleEntries.length);
    const winnerEntries = drawRandom.sample(raffleEntries, prizesToAward);

    const rewardsCreated: string[] = [];
    const vouchersCreated: string[] = [];
    let usedSecretCodes = [...raffle.usedSecretCodes];

    for (const winnerEntry of winnerEntries) {
      const winnerUser = await db.query.users.findFirst({ where: eq(users.id, winnerEntry.userId) });
      if (!winnerUser) continue;

      const rewardId = crypto.randomUUID();
      await db.insert(rewards).values({
        id: rewardId,
        userId: winnerEntry.userId,
        raffleId,
        raffleTitle: raffle.title,
        prizeDetails: raffle.description,
        partnerName: raffle.partnerName ?? "WinWai",
      });
      rewardsCreated.push(rewardId);

      const now = new Date();
      const validUntil = new Date(now.getTime() + raffle.validityMonths * 30 * 24 * 60 * 60 * 1000);

      let secretCode: string | null = null;
      if (raffle.isDigitalPrize) {
        const available = raffle.secretCodes.filter((c) => !usedSecretCodes.includes(c));
        if (available.length > 0) {
          secretCode = available[0];
          usedSecretCodes = [...usedSecretCodes, secretCode];
          await db.update(raffles).set({ usedSecretCodes }).where(eq(raffles.id, raffleId));
        }
      }

      const voucherRef = generateVoucherReference();
      await db.insert(vouchers).values({
        id: crypto.randomUUID(),
        voucherRef,
        userId: winnerEntry.userId,
        userName: winnerUser.name || "User",
        userEmail: winnerUser.email || "",
        raffleId,
        raffleTitle: raffle.title,
        partnerId: raffle.partnerId ?? "",
        partnerName: raffle.partnerName ?? "WinWai",
        prizeValue: raffle.prizeValue,
        currency: raffle.currency,
        isDigitalPrize: raffle.isDigitalPrize,
        secretCode,
        verificationCode: generateVerificationCode(),
        validUntil,
        partnerEmail: partner?.email ?? null,
        partnerWhatsapp: partner?.whatsapp ?? null,
        partnerLine: partner?.line ?? null,
        partnerAddress: partner?.address ?? null,
      });
      vouchersCreated.push(voucherRef);
    }

    const prizesRemaining = raffle.prizesRemaining - prizesToAward;
    await db.update(raffles).set({ prizesRemaining, active: prizesRemaining > 0 }).where(eq(raffles.id, raffleId));

    return json({
      message: `Drew ${prizesToAward} winner(s)`,
      winners: winnerEntries.map((w) => w.userId),
      rewardsCreated,
      vouchersCreated,
    });
  } catch (e) {
    return handleError(e);
  }
};
