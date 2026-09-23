import type { APIRoute } from "astro";
import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../lib/db/client";
import { partners } from "../../../db/schema";
import { json, handleError } from "../../../lib/respond";

export const GET: APIRoute = async ({ locals, url }) => {
  try {
    const db = getDb(locals.runtime.env);
    const sponsoredOnly = url.searchParams.get("sponsored") === "true";
    const query = db.select().from(partners).orderBy(desc(partners.createdAt)).limit(1000);
    const results = sponsoredOnly ? await query.where(eq(partners.sponsored, true)) : await query;
    return json(results);
  } catch (e) {
    return handleError(e);
  }
};
