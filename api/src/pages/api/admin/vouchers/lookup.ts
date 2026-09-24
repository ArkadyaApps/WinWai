import type { APIRoute } from "astro";
import { getDb } from "../../../../lib/db/client";
import { findVoucherByCode, toAdminVoucherView } from "../../../../lib/db/vouchers";
import { requireAdmin } from "../../../../lib/auth";
import { json, handleError } from "../../../../lib/respond";
import { LookupVoucherQuerySchema } from "../../../../lib/validations/voucher";

// Admin at the counter: enter the code a winner shows (verification code or
// full reference) to see what it's for and whether it can still be redeemed.
export const GET: APIRoute = async ({ request, url, locals }) => {
  try {
    const db = getDb(locals.runtime.env);
    await requireAdmin(db, request);

    const parsed = LookupVoucherQuerySchema.safeParse({ code: url.searchParams.get("code") ?? "" });
    if (!parsed.success) return json({ error: "Enter the voucher code" }, 400);

    const voucher = await findVoucherByCode(db, parsed.data.code);
    if (!voucher) return json({ error: "No voucher found for that code" }, 404);
    return json(toAdminVoucherView(voucher));
  } catch (e) {
    return handleError(e);
  }
};
