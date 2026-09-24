import type { APIRoute } from "astro";
import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../lib/db/client";
import { raffles, users, winners } from "../../../db/schema";
import { json, handleError } from "../../../lib/respond";
import { maskEmail } from "../../../lib/raffleHelpers";

// Feed for the scrolling winners banner. Public by design, so the email is
// masked HERE (never sent in full) and nothing else about the user is exposed.
export const GET: APIRoute = async ({ locals }) => {
  try {
    const db = getDb(locals.runtime.env);
    const rows = await db
      .select({ email: users.email, raffleTitle: raffles.title, wonAt: winners.drawDate })
      .from(winners)
      .innerJoin(users, eq(winners.userId, users.id))
      .innerJoin(raffles, eq(winners.raffleId, raffles.id))
      .orderBy(desc(winners.drawDate))
      .limit(20);

    return json(rows.map((r) => ({ maskedEmail: maskEmail(r.email), raffleTitle: r.raffleTitle, wonAt: r.wonAt })));
  } catch (e) {
    return handleError(e);
  }
};
