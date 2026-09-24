import { and, eq, gte, isNull, sql } from "drizzle-orm";
import { entries, raffles, users, winners } from "../../db/schema";
import { HttpError } from "../auth";
import { getScheduledDrawAt } from "../raffleHelpers";
import type { Database } from "./client";

export interface EnterRaffleResult {
  newBalance: number;
  entryId: string;
  /** True only for the entry that pushed the current round over its ticket goal. */
  goalReached: boolean;
  scheduledDrawAt: Date | null;
  /** What this entry cost: always the raffle's ticketCost. */
  ticketsSpent: number;
}

/**
 * Spends tickets on a raffle entry. Everything that must not race is a single
 * conditional statement: the ticket deduction (balance re-checked in the same
 * UPDATE) and the goal-reached stamp (only set while still NULL and only once
 * the round's ticket count actually meets the goal), so concurrent entries can
 * neither overdraw a balance nor start a round's clock twice.
 */
export async function enterRaffle(
  db: Database,
  userId: string,
  raffleId: string,
  now: Date = new Date()
): Promise<EnterRaffleResult> {
  const raffle = await db.query.raffles.findFirst({ where: eq(raffles.id, raffleId) });
  if (!raffle) throw new HttpError(404, "Raffle not found");
  if (!raffle.active) throw new HttpError(400, "Raffle is not active");
  if (raffle.prizesRemaining <= 0) throw new HttpError(400, "No prizes remaining");

  // The price of an entry is set by the raffle, not the caller: a client-sent
  // amount would let anyone enter a 10-ticket raffle for 1 ticket (and skew
  // the round's ticket goal).
  const ticketsToUse = raffle.ticketCost;

  // One prize per user per raffle: a past winner can never win again, so don't
  // let them spend tickets on entries that can't pay off.
  const alreadyWon = await db.query.winners.findFirst({ where: and(eq(winners.raffleId, raffleId), eq(winners.userId, userId)) });
  if (alreadyWon) throw new HttpError(400, "You have already won a prize in this raffle");

  // Once a round's goal is met its draw is scheduled; entries close at that
  // moment so a late draw run can't quietly change the pool.
  const scheduled = getScheduledDrawAt(raffle.thresholdReachedAt, raffle.prizeValueUsd);
  if (scheduled && now.getTime() >= scheduled.getTime()) {
    throw new HttpError(400, "Entries are closed while this round's draw is pending");
  }

  const deducted = await db
    .update(users)
    .set({ tickets: sql`${users.tickets} - ${ticketsToUse}` })
    .where(and(eq(users.id, userId), gte(users.tickets, ticketsToUse)))
    .returning({ tickets: users.tickets });
  if (deducted.length === 0) throw new HttpError(400, "Insufficient tickets");

  const entryId = crypto.randomUUID();
  try {
    const [, , crossed] = await db.batch([
      db.insert(entries).values({ id: entryId, userId, raffleId, raffleTitle: raffle.title, ticketsUsed: ticketsToUse }),
      db
        .update(raffles)
        .set({
          totalEntries: sql`${raffles.totalEntries} + 1`,
          totalTicketsCollected: sql`${raffles.totalTicketsCollected} + ${ticketsToUse}`,
        })
        .where(eq(raffles.id, raffleId)),
      // Runs after the totals update above (D1 batches execute in order in
      // one transaction), so it sees the new total.
      db
        .update(raffles)
        .set({ thresholdReachedAt: now, drawStatus: "eligible" })
        .where(
          and(
            eq(raffles.id, raffleId),
            isNull(raffles.thresholdReachedAt),
            sql`${raffles.totalTicketsCollected} - ${raffles.roundStartTickets} >= ${raffles.gamePrice}`
          )
        )
        .returning({ id: raffles.id }),
    ]);

    const goalReached = crossed.length > 0;
    return {
      newBalance: deducted[0].tickets,
      ticketsSpent: ticketsToUse,
      entryId,
      goalReached,
      scheduledDrawAt: goalReached ? getScheduledDrawAt(now, raffle.prizeValueUsd) : scheduled,
    };
  } catch (e) {
    // The tickets were already taken; don't lose them if recording the entry failed.
    await db.update(users).set({ tickets: sql`${users.tickets} + ${ticketsToUse}` }).where(eq(users.id, userId));
    throw e;
  }
}
