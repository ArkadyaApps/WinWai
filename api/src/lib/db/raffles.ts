import { and, eq, isNull, sql } from "drizzle-orm";
import { raffles } from "../../db/schema";
import type { Database } from "./client";

/**
 * Starts the current round's clock if its ticket goal is already met but was
 * never stamped (e.g. an admin lowered the goal below the tickets collected so
 * far - the entry path only stamps on the entry that crosses the goal).
 * Conditional, so it's a no-op when the clock is already running.
 */
export async function stampThresholdIfReached(db: Database, raffleId: string, now: Date = new Date()): Promise<boolean> {
  const stamped = await db
    .update(raffles)
    .set({ thresholdReachedAt: now, drawStatus: "eligible" })
    .where(
      and(
        eq(raffles.id, raffleId),
        eq(raffles.active, true),
        isNull(raffles.thresholdReachedAt),
        sql`${raffles.totalEntries} > 0`,
        sql`${raffles.totalTicketsCollected} - ${raffles.roundStartTickets} >= ${raffles.gamePrice}`
      )
    )
    .returning({ id: raffles.id });
  return stamped.length > 0;
}
