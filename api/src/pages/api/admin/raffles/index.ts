import type { APIRoute } from "astro";
import { desc } from "drizzle-orm";
import { getDb } from "../../../../lib/db/client";
import { raffles } from "../../../../db/schema";
import { requireAdmin } from "../../../../lib/auth";
import { json, handleError } from "../../../../lib/respond";
import { CreateRaffleSchema } from "../../../../lib/validations/admin";
import { convertToUsd, withRoundInfo } from "../../../../lib/raffleHelpers";

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const db = getDb(locals.runtime.env);
    await requireAdmin(db, request);
    const results = await db.select().from(raffles).orderBy(desc(raffles.createdAt)).limit(1000);
    return json(results.map(withRoundInfo));
  } catch (e) {
    return handleError(e);
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = getDb(locals.runtime.env);
    await requireAdmin(db, request);

    const parsed = CreateRaffleSchema.safeParse(await request.json());
    if (!parsed.success) return json({ error: parsed.error.issues[0].message }, 400);
    const data = parsed.data;

    const createdAt = new Date();
    const prizeValueUsd = convertToUsd(data.prizeValue, data.currency);

    const newRaffle = {
      id: crypto.randomUUID(),
      ...data,
      prizesRemaining: data.prizesAvailable,
      prizeValueUsd,
      // drawDate is deprecated (NOT NULL only for schema compatibility); the
      // draw is scheduled from thresholdReachedAt once the ticket goal is met.
      drawDate: createdAt,
      thresholdReachedAt: null,
      roundStartTickets: 0,
      totalEntries: 0,
      totalTicketsCollected: 0,
      usedSecretCodes: [],
      createdAt,
    };
    await db.insert(raffles).values(newRaffle);
    return json(withRoundInfo(newRaffle));
  } catch (e) {
    return handleError(e);
  }
};
