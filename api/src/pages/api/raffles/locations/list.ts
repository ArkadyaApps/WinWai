import type { APIRoute } from "astro";
import { and, eq, isNotNull, ne } from "drizzle-orm";
import { getDb } from "../../../../lib/db/client";
import { raffles } from "../../../../db/schema";
import { json, handleError } from "../../../../lib/respond";

export const GET: APIRoute = async ({ locals }) => {
  try {
    const db = getDb(locals.runtime.env);
    const rows = await db
      .selectDistinct({ location: raffles.location })
      .from(raffles)
      .where(and(eq(raffles.active, true), isNotNull(raffles.location), ne(raffles.location, "")));

    const locations = rows.map((r) => r.location).filter((l): l is string => Boolean(l)).sort();
    return json({ locations });
  } catch (e) {
    return handleError(e);
  }
};
