import type { APIRoute } from "astro";
import { desc } from "drizzle-orm";
import { getDb } from "../../../../lib/db/client";
import { raffles } from "../../../../db/schema";
import { requireAdmin } from "../../../../lib/auth";
import { json, handleError } from "../../../../lib/respond";
import { CreateRaffleSchema } from "../../../../lib/validations/admin";
import { calculateMinimumDrawDate, convertToUsd } from "../../../../lib/raffleHelpers";

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const db = getDb(locals.runtime.env);
    await requireAdmin(db, request);
    const results = await db.select().from(raffles).orderBy(desc(raffles.createdAt)).limit(1000);
    return json(results);
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
      minimumDrawDate: calculateMinimumDrawDate(prizeValueUsd, createdAt),
      totalEntries: 0,
      totalTicketsCollected: 0,
      usedSecretCodes: [],
      createdAt,
    };
    await db.insert(raffles).values(newRaffle);
    return json(newRaffle);
  } catch (e) {
    return handleError(e);
  }
};
