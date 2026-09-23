import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";
import { getDb } from "../../../lib/db/client";
import { partners } from "../../../db/schema";
import { json, handleError } from "../../../lib/respond";

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const db = getDb(locals.runtime.env);
    const partner = await db.query.partners.findFirst({ where: eq(partners.id, params.id!) });
    if (!partner) return json({ error: "Partner not found" }, 404);
    return json(partner);
  } catch (e) {
    return handleError(e);
  }
};
