import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";
import { getDb } from "../../../../lib/db/client";
import { raffles } from "../../../../db/schema";
import { requireAdmin } from "../../../../lib/auth";
import { json, handleError } from "../../../../lib/respond";
import { UpdateRaffleSchema } from "../../../../lib/validations/admin";
import { convertToUsd } from "../../../../lib/raffleHelpers";

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

    const result = await db.update(raffles).set(data).where(eq(raffles.id, raffleId)).returning();
    if (result.length === 0) return json({ error: "Raffle not found" }, 404);

    return json(result[0]);
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
