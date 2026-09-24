import type { APIRoute } from "astro";
import { getDb } from "../../../lib/db/client";
import { enterRaffle } from "../../../lib/db/entries";
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

    const result = await enterRaffle(db, user.id, raffleId, ticketsToUse);
    return json({ message: "Entered successfully", ...result });
  } catch (e) {
    return handleError(e);
  }
};
