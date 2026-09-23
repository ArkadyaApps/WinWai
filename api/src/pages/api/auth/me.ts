import type { APIRoute } from "astro";
import { getDb } from "../../../lib/db/client";
import { requireUser } from "../../../lib/auth";
import { json, handleError } from "../../../lib/respond";

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const db = getDb(locals.runtime.env);
    const user = await requireUser(db, request);
    const { passwordHash, resetToken, resetTokenExpiry, ...safeUser } = user;
    return json(safeUser);
  } catch (e) {
    return handleError(e);
  }
};
