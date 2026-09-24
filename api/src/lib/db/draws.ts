import { and, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { entries, partners, raffles, users, vouchers, winners } from "../../db/schema";
import { drawRandom, generateVerificationCode, generateVoucherReference, getCurrentRound, isRoundDue } from "../raffleHelpers";
import type { Database } from "./client";

type RaffleRow = typeof raffles.$inferSelect;

export type DrawResult =
  | {
      status: "drawn";
      raffleId: string;
      title: string;
      round: number;
      winnerUserId: string;
      voucherRef: string;
      prizesRemaining: number;
    }
  | { status: "skipped"; raffleId: string; title: string; reason: string };

export interface DueDrawsSummary {
  drawn: Extract<DrawResult, { status: "drawn" }>[];
  skipped: Extract<DrawResult, { status: "skipped" }>[];
  errors: { raffleId: string; title: string; error: string }[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Draws ONE round (one prize) for a raffle.
 *
 * Winner pool = every entry from users who haven't already won this raffle
 * (one prize per user; non-winners' entries stay in for later rounds).
 * The raffle row is claimed with a single conditional UPDATE keyed on the
 * prizesRemaining value we read, so a cron run and an admin click can't both
 * award the same round. That same UPDATE rolls the round forward: it consumes
 * one goal's worth of tickets (surplus carries over), and if the carried-over
 * surplus already meets the next goal the next round's clock starts now.
 */
export async function drawRound(db: Database, raffle: RaffleRow, now: Date = new Date()): Promise<DrawResult> {
  const skip = (reason: string): DrawResult => ({ status: "skipped", raffleId: raffle.id, title: raffle.title, reason });
  if (raffle.prizesRemaining <= 0) return skip("no_prizes_remaining");

  const pool = await db
    .select()
    .from(entries)
    .where(
      and(
        eq(entries.raffleId, raffle.id),
        sql`${entries.userId} NOT IN (SELECT ${winners.userId} FROM ${winners} WHERE ${winners.raffleId} = ${raffle.id})`
      )
    )
    .limit(10000);
  if (pool.length === 0) {
    // Everyone who entered has already won. Entries close at the scheduled draw
    // time, so leaving the clock as-is would lock the round for good with
    // nobody able to join - restart it so entries reopen for a full delay period.
    if (raffle.thresholdReachedAt) {
      await db
        .update(raffles)
        .set({ thresholdReachedAt: now })
        .where(and(eq(raffles.id, raffle.id), eq(raffles.prizesRemaining, raffle.prizesRemaining)));
    }
    return skip("no_eligible_entrants");
  }

  const winnerEntry = drawRandom.choice(pool);
  const winnerUser = await db.query.users.findFirst({ where: eq(users.id, winnerEntry.userId) });
  if (!winnerUser) return skip("winner_user_not_found");

  const partner = raffle.partnerId ? await db.query.partners.findFirst({ where: eq(partners.id, raffle.partnerId) }) : null;

  let secretCode: string | null = null;
  if (raffle.isDigitalPrize) {
    secretCode = raffle.secretCodes.find((c) => !raffle.usedSecretCodes.includes(c)) ?? null;
    if (!secretCode) return skip("no_secret_codes_available");
  }

  const round = getCurrentRound(raffle.prizesAvailable, raffle.prizesRemaining);
  const nextStart = sql`MIN(${raffles.roundStartTickets} + ${raffles.gamePrice}, ${raffles.totalTicketsCollected})`;
  const nextGoalMet = sql`${raffles.prizesRemaining} > 1 AND ${raffles.totalTicketsCollected} - ${nextStart} >= ${raffles.gamePrice}`;

  const claimed = await db
    .update(raffles)
    .set({
      prizesRemaining: sql`${raffles.prizesRemaining} - 1`,
      roundStartTickets: nextStart,
      thresholdReachedAt: sql`CASE WHEN ${nextGoalMet} THEN ${now.getTime()} ELSE NULL END`,
      drawStatus: sql`CASE WHEN ${raffles.prizesRemaining} <= 1 THEN 'drawn' WHEN ${nextGoalMet} THEN 'eligible' ELSE 'pending' END`,
      active: sql`CASE WHEN ${raffles.prizesRemaining} <= 1 THEN 0 ELSE 1 END`,
      drawnAt: now,
      usedSecretCodes: secretCode ? [...raffle.usedSecretCodes, secretCode] : raffle.usedSecretCodes,
    })
    .where(and(eq(raffles.id, raffle.id), eq(raffles.prizesRemaining, raffle.prizesRemaining)))
    .returning({ prizesRemaining: raffles.prizesRemaining });
  if (claimed.length === 0) return skip("already_drawn_by_another_run");

  const voucherId = crypto.randomUUID();
  const voucherRef = generateVoucherReference();
  try {
    await db.batch([
      db.insert(vouchers).values({
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
        validUntil: new Date(now.getTime() + raffle.validityMonths * 30 * DAY_MS),
        partnerEmail: partner?.email ?? null,
        partnerWhatsapp: partner?.whatsapp ?? null,
        partnerLine: partner?.line ?? null,
        partnerAddress: partner?.address ?? null,
      }),
      db.insert(winners).values({
        id: crypto.randomUUID(),
        userId: winnerUser.id,
        raffleId: raffle.id,
        entryId: winnerEntry.id,
        voucherId,
        round,
        drawDate: now,
      }),
    ]);
  } catch (e) {
    // Give the prize back rather than leaving a round consumed with no winner.
    await db
      .update(raffles)
      .set({
        prizesRemaining: raffle.prizesRemaining,
        roundStartTickets: raffle.roundStartTickets,
        thresholdReachedAt: raffle.thresholdReachedAt,
        drawStatus: raffle.drawStatus,
        active: raffle.active,
        drawnAt: raffle.drawnAt,
        usedSecretCodes: raffle.usedSecretCodes,
      })
      .where(and(eq(raffles.id, raffle.id), eq(raffles.prizesRemaining, claimed[0].prizesRemaining)));
    throw e;
  }

  return {
    status: "drawn",
    raffleId: raffle.id,
    title: raffle.title,
    round,
    winnerUserId: winnerUser.id,
    voucherRef,
    prizesRemaining: claimed[0].prizesRemaining,
  };
}

/** Admin override: draw the raffle's current round right now, due or not. */
export async function drawRaffleNow(db: Database, raffleId: string, now: Date = new Date()): Promise<DrawResult | null> {
  const raffle = await db.query.raffles.findFirst({ where: eq(raffles.id, raffleId) });
  if (!raffle) return null;
  return drawRound(db, raffle, now);
}

/**
 * Draws every round that is due: goal reached and the tier delay elapsed.
 * Used by both the admin API route and the scheduled Worker (cron).
 */
export async function runDueDraws(db: Database, now: Date = new Date()): Promise<DueDrawsSummary> {
  const summary: DueDrawsSummary = { drawn: [], skipped: [], errors: [] };

  const candidates = await db
    .select()
    .from(raffles)
    .where(and(eq(raffles.active, true), inArray(raffles.drawStatus, ["pending", "eligible"]), isNotNull(raffles.thresholdReachedAt)))
    .limit(1000);

  for (const start of candidates) {
    try {
      let current: RaffleRow | undefined = start;
      // Bounded by the prize count; after a draw the next round's clock
      // restarts at `now`, so in practice this draws once per due raffle.
      for (let i = 0; current && i < start.prizesAvailable; i++) {
        if (current.prizesRemaining <= 0 || !isRoundDue(current.thresholdReachedAt, current.prizeValueUsd, now)) break;
        const result = await drawRound(db, current, now);
        if (result.status === "skipped") {
          summary.skipped.push(result);
          break;
        }
        summary.drawn.push(result);
        current = await db.query.raffles.findFirst({ where: eq(raffles.id, start.id) });
      }
    } catch (e) {
      summary.errors.push({ raffleId: start.id, title: start.title, error: e instanceof Error ? e.message : String(e) });
    }
  }
  return summary;
}
