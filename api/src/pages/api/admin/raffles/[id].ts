import type { APIRoute } from "astro";
import { eq, sql } from "drizzle-orm";
import { getDb } from "../../../../lib/db/client";
import { raffles } from "../../../../db/schema";
import { requireAdmin } from "../../../../lib/auth";
import { json, handleError } from "../../../../lib/respond";
import { UpdateRaffleSchema } from "../../../../lib/validations/admin";
import { convertToUsd, withRoundInfo } from "../../../../lib/raffleHelpers";
import { stampThresholdIfReached } from "../../../../lib/db/raffles";

export const PUT: APIRoute = async ({ request, params, locals }) => {
  try {
    const db = getDb(locals.runtime.env);
    await requireAdmin(db, request);
    const raffleId = params.id!;

    const parsed = UpdateRaffleSchema.safeParse(await request.json());
    if (!parsed.success) return json({ error: parsed.error.issues[0].message }, 400);
    const data = { ...parsed.data };

    if (data.prizeValue !== undefined && data.currency !== undefined) {
      data.prizeValueUsd = convertToUsd(data.prizeValue, data.currency);
    }

    // Changing the prize count moves prizesRemaining by the same amount (relative
    // SQL, so a draw landing at the same moment isn't overwritten). Prizes
    // already awarded can't be "un-awarded" by lowering the total.
    let prizesRemainingDelta = 0;
    if (data.prizesAvailable !== undefined) {
      const existing = await db.query.raffles.findFirst({ where: eq(raffles.id, raffleId) });
      if (!existing) return json({ error: "Raffle not found" }, 404);
      const awarded = existing.prizesAvailable - existing.prizesRemaining;
      if (data.prizesAvailable < awarded) {
        return json({ error: `Prizes available can't be lower than the ${awarded} already awarded` }, 400);
      }
      prizesRemainingDelta = data.prizesAvailable - existing.prizesAvailable;
    }

    const result = await db
      .update(raffles)
      .set({ ...data, ...(prizesRemainingDelta !== 0 ? { prizesRemaining: sql`${raffles.prizesRemaining} + ${prizesRemainingDelta}` } : {}) })
      .where(eq(raffles.id, raffleId))
      .returning();
    if (result.length === 0) return json({ error: "Raffle not found" }, 404);

    // Lowering the ticket goal can make an in-progress round qualify immediately.
    if (data.gamePrice !== undefined && (await stampThresholdIfReached(db, raffleId))) {
      const refreshed = await db.query.raffles.findFirst({ where: eq(raffles.id, raffleId) });
      if (refreshed) return json(withRoundInfo(refreshed));
    }

    return json(withRoundInfo(result[0]));
  } catch (e) {
    return handleError(e);
  }
};

export const DELETE: APIRoute = async ({ request, params, locals }) => {
  try {
    const db = getDb(locals.runtime.env);
    await requireAdmin(db, request);
    const raffleId = params.id!;

    const result = await db.delete(raffles).where(eq(raffles.id, raffleId)).returning({ id: raffles.id });
    if (result.length === 0) return json({ error: "Raffle not found" }, 404);

    return json({ message: "Raffle deleted successfully" });
  } catch (e) {
    return handleError(e);
  }
};
