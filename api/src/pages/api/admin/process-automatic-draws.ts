import type { APIRoute } from "astro";
import { and, eq, inArray, lte } from "drizzle-orm";
import { getDb } from "../../../lib/db/client";
import { entries, partners, raffles, users, vouchers, winners } from "../../../db/schema";
import { requireAdmin } from "../../../lib/auth";
import { json, handleError } from "../../../lib/respond";
import { drawRandom, generateVerificationCode, generateVoucherReference, getExtensionPeriodMs } from "../../../lib/raffleHelpers";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = getDb(locals.runtime.env);
    await requireAdmin(db, request);

    const now = new Date();
    const results = {
      processedRaffles: [] as string[],
      drawnRaffles: [] as Record<string, unknown>[],
      extendedRaffles: [] as Record<string, unknown>[],
      errors: [] as Record<string, unknown>[],
    };

    const raffleseDue = await db
      .select()
      .from(raffles)
      .where(
        and(
          inArray(raffles.drawStatus, ["pending", "eligible"]),
          lte(raffles.drawDate, now),
          eq(raffles.active, true)
        )
      )
      .limit(1000);

    for (const raffle of raffleseDue) {
      try {
        if (raffle.minimumDrawDate && now < raffle.minimumDrawDate) {
          results.errors.push({ raffleId: raffle.id, title: raffle.title, error: "Minimum draw date not yet reached" });
          continue;
        }

        const totalTickets = raffle.totalTicketsCollected;
        const gamePrice = raffle.gamePrice;

        if (totalTickets >= gamePrice) {
          const raffleEntries = await db.select().from(entries).where(eq(entries.raffleId, raffle.id)).limit(10000);
          if (raffleEntries.length === 0) {
            results.errors.push({ raffleId: raffle.id, title: raffle.title, error: "No entries found despite ticket count" });
            continue;
          }

          const winnerEntry = drawRandom.choice(raffleEntries);
          const winnerUser = await db.query.users.findFirst({ where: eq(users.id, winnerEntry.userId) });
          if (!winnerUser) {
            results.errors.push({ raffleId: raffle.id, title: raffle.title, error: "Winner user not found" });
            continue;
          }

          const partner = raffle.partnerId
            ? await db.query.partners.findFirst({ where: eq(partners.id, raffle.partnerId) })
            : null;

          const validUntil = new Date(now.getTime() + raffle.validityMonths * 30 * 24 * 60 * 60 * 1000);

          let secretCode: string | null = null;
          if (raffle.isDigitalPrize) {
            const available = raffle.secretCodes.filter((c) => !raffle.usedSecretCodes.includes(c));
            if (available.length === 0) {
              results.errors.push({ raffleId: raffle.id, title: raffle.title, error: "Digital prize but no secret codes available" });
              continue;
            }
            secretCode = available[0];
            await db
              .update(raffles)
              .set({ usedSecretCodes: [...raffle.usedSecretCodes, secretCode] })
              .where(eq(raffles.id, raffle.id));
          }

          const voucherId = crypto.randomUUID();
          const voucherRef = generateVoucherReference();
          await db.insert(vouchers).values({
            id: voucherId,
            voucherRef,
            userId: winnerUser.id,
            userName: winnerUser.name || "User",
            userEmail: winnerUser.email || "",
            raffleId: raffle.id,
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

          await db.insert(winners).values({
            id: crypto.randomUUID(),
            userId: winnerUser.id,
            raffleId: raffle.id,
            entryId: winnerEntry.id,
            voucherId,
            drawDate: now,
          });

          const prizesRemaining = raffle.prizesRemaining - 1;
          await db
            .update(raffles)
            .set({ drawStatus: "drawn", drawnAt: now, prizesRemaining, active: prizesRemaining > 0 })
            .where(eq(raffles.id, raffle.id));

          results.drawnRaffles.push({
            raffleId: raffle.id,
            title: raffle.title,
            winnerId: winnerUser.id,
            winnerName: winnerUser.name,
            voucherId,
            voucherRef,
          });
        } else {
          const extensionMs = getExtensionPeriodMs(raffle.prizeValueUsd);
          const newDrawDate = new Date(now.getTime() + extensionMs);
          await db
            .update(raffles)
            .set({ drawDate: newDrawDate, lastExtensionDate: now, drawStatus: "extended" })
            .where(eq(raffles.id, raffle.id));

          results.extendedRaffles.push({
            raffleId: raffle.id,
            title: raffle.title,
            currentTickets: totalTickets,
            requiredTickets: gamePrice,
            newDrawDate: newDrawDate.toISOString(),
          });
        }

        results.processedRaffles.push(raffle.id);
      } catch (e) {
        results.errors.push({ raffleId: raffle.id, title: raffle.title, error: e instanceof Error ? e.message : String(e) });
      }
    }

    return json({ success: true, message: `Processed ${results.processedRaffles.length} raffles`, results });
  } catch (e) {
    return handleError(e);
  }
};
