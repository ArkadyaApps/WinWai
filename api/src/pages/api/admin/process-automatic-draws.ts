import type { APIRoute } from "astro";
import { getDb } from "../../../lib/db/client";
import { runDueDraws } from "../../../lib/db/draws";
import { requireAdmin } from "../../../lib/auth";
import { json, handleError } from "../../../lib/respond";

// Same job the scheduled Worker (../cron) runs every few minutes; kept as an
// admin endpoint so a draw run can also be triggered by hand.
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = getDb(locals.runtime.env);
    await requireAdmin(db, request);

    const results = await runDueDraws(db);
    return json({ success: true, message: `Drew ${results.drawn.length} round(s)`, results });
  } catch (e) {
    return handleError(e);
  }
};
