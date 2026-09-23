import type { APIRoute } from "astro";
import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../../lib/db/client";
import { entries } from "../../../../db/schema";
import { requireUser } from "../../../../lib/auth";
import { json, handleError } from "../../../../lib/respond";

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const db = getDb(locals.runtime.env);
    const user = await requireUser(db, request);
    const results = await db
      .select()
      .from(entries)
      .where(eq(entries.userId, user.id))
      .orderBy(desc(entries.timestamp))
      .limit(100);
    return json(results);
  } catch (e) {
    return handleError(e);
  }
};
