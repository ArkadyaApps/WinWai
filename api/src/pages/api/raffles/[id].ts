import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";
import { getDb } from "../../../lib/db/client";
import { raffles } from "../../../db/schema";
import { json, handleError } from "../../../lib/respond";

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const db = getDb(locals.runtime.env);
    const raffle = await db.query.raffles.findFirst({ where: eq(raffles.id, params.id!) });
    if (!raffle) return json({ error: "Raffle not found" }, 404);
    return json(raffle);
  } catch (e) {
    return handleError(e);
  }
};
