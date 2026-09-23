import type { APIRoute } from "astro";
import { and, eq, gte, sql } from "drizzle-orm";
import { getDb } from "../../../lib/db/client";
import { entries, raffles, users } from "../../../db/schema";
import { requireUser } from "../../../lib/auth";
import { json, handleError } from "../../../lib/respond";
import { RaffleEntrySchema } from "../../../lib/validations/raffle";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = getDb(locals.runtime.env);
    const user = await requireUser(db, request);

    const parsed = RaffleEntrySchema.safeParse(await request.json());
    if (!parsed.success) return json({ error: parsed.error.issues[0].message }, 400);
    const { raffleId, ticketsToUse } = parsed.data;

    const raffle = await db.query.raffles.findFirst({ where: eq(raffles.id, raffleId) });
    if (!raffle) return json({ error: "Raffle not found" }, 404);
    if (!raffle.active) return json({ error: "Raffle is not active" }, 400);
    if (raffle.prizesRemaining <= 0) return json({ error: "No prizes remaining" }, 400);

    // Atomic, race-safe deduction: the WHERE clause re-checks the balance as
    // part of the same statement, so two concurrent entries can't both pass
    // a separate read-based check and take the balance negative.
    const deducted = await db
      .update(users)
      .set({ tickets: sql`${users.tickets} - ${ticketsToUse}` })
      .where(and(eq(users.id, user.id), gte(users.tickets, ticketsToUse)))
      .returning({ tickets: users.tickets });

    if (deducted.length === 0) return json({ error: "Insufficient tickets" }, 400);
    const newBalance = deducted[0].tickets;

    const entryId = crypto.randomUUID();
    await db.batch([
      db.insert(entries).values({
        id: entryId,
        userId: user.id,
        raffleId,
        raffleTitle: raffle.title,
        ticketsUsed: ticketsToUse,
      }),
      db
        .update(raffles)
        .set({
          totalEntries: sql`${raffles.totalEntries} + 1`,
          totalTicketsCollected: sql`${raffles.totalTicketsCollected} + ${ticketsToUse}`,
        })
        .where(eq(raffles.id, raffleId)),
    ]);

    return json({ message: "Entered successfully", newBalance, entryId });
  } catch (e) {
    return handleError(e);
  }
};
