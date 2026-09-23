import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";
import { getDb } from "../../../lib/db/client";
import { userSessions } from "../../../db/schema";
import { json, handleError } from "../../../lib/respond";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = getDb(locals.runtime.env);
    const auth = request.headers.get("Authorization");
    if (auth?.startsWith("Bearer ")) {
      const token = auth.slice("Bearer ".length);
      await db.delete(userSessions).where(eq(userSessions.sessionToken, token));
    }
    return json({ message: "Logged out successfully" });
  } catch (e) {
    return handleError(e);
  }
};
