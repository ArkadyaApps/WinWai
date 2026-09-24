import type { APIRoute } from "astro";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../../../lib/db/client";
import { raffles } from "../../../db/schema";
import { json, handleError } from "../../../lib/respond";
import { withRoundInfo } from "../../../lib/raffleHelpers";

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const db = getDb(locals.runtime.env);
    const category = url.searchParams.get("category");
    const location = url.searchParams.get("location");
    const activeParam = url.searchParams.get("active");
    const active = activeParam === null ? true : activeParam !== "false";

    const conditions = [eq(raffles.active, active)];
    if (category && category !== "all") conditions.push(eq(raffles.category, category));
    if (location && location !== "all") conditions.push(eq(raffles.location, location));

    const rows = await db.select().from(raffles).where(and(...conditions)).orderBy(desc(raffles.createdAt)).limit(100);

    // Soonest scheduled draw first (those have met their goal), then the rest newest-first.
    const results = rows.map(withRoundInfo).sort((a, b) => {
      if (a.scheduledDrawAt && b.scheduledDrawAt) return a.scheduledDrawAt.getTime() - b.scheduledDrawAt.getTime();
      if (a.scheduledDrawAt) return -1;
      if (b.scheduledDrawAt) return 1;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    return json(results);
  } catch (e) {
    return handleError(e);
  }
};
