import type { APIRoute } from "astro";
import { desc } from "drizzle-orm";
import { getDb } from "../../../lib/db/client";
import { partners } from "../../../db/schema";
import { json, handleError } from "../../../lib/respond";

export const GET: APIRoute = async ({ locals }) => {
  try {
    const db = getDb(locals.runtime.env);
    const results = await db.select().from(partners).orderBy(desc(partners.createdAt)).limit(1000);
    return json(results);
  } catch (e) {
    return handleError(e);
  }
};
