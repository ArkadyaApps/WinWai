import type { APIRoute } from "astro";
import { getDb } from "../../../lib/db/client";
import { drawRaffleNow } from "../../../lib/db/draws";
import { requireAdmin } from "../../../lib/auth";
import { json, handleError } from "../../../lib/respond";
import { DrawWinnerSchema } from "../../../lib/validations/raffle";

// Admin override: draws the raffle's CURRENT round immediately (one prize,
// one winner), regardless of whether the ticket goal or delay has elapsed.
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = getDb(locals.runtime.env);
    await requireAdmin(db, request);

    const parsed = DrawWinnerSchema.safeParse(await request.json());
    if (!parsed.success) return json({ error: "raffleId required" }, 400);

    const result = await drawRaffleNow(db, parsed.data.raffleId);
    if (!result) return json({ error: "Raffle not found" }, 404);
    if (result.status === "skipped") return json({ error: `Nothing drawn: ${result.reason}`, result }, 400);

    return json({ message: `Round ${result.round} drawn`, result });
  } catch (e) {
    return handleError(e);
  }
};
