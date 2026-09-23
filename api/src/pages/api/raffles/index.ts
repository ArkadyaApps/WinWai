import type { APIRoute } from "astro";
import { and, asc, eq } from "drizzle-orm";
import { getDb } from "../../../lib/db/client";
import { raffles } from "../../../db/schema";
import { json, handleError } from "../../../lib/respond";

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

    const results = await db
      .select()
      .from(raffles)
      .where(and(...conditions))
      .orderBy(asc(raffles.drawDate))
      .limit(100);

    return json(results);
  } catch (e) {
    return handleError(e);
  }
};
