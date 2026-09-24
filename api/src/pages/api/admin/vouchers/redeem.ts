import type { APIRoute } from "astro";
import { getDb } from "../../../../lib/db/client";
import { redeemVoucher, toAdminVoucherView } from "../../../../lib/db/vouchers";
import { requireAdmin } from "../../../../lib/auth";
import { json, handleError } from "../../../../lib/respond";
import { RedeemVoucherSchema } from "../../../../lib/validations/voucher";

const REASONS: Record<string, { status: number; message: string }> = {
  not_found: { status: 404, message: "Voucher not found" },
  already_redeemed: { status: 409, message: "This voucher has already been redeemed" },
  expired: { status: 409, message: "This voucher has expired" },
  cancelled: { status: 409, message: "This voucher was cancelled" },
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = getDb(locals.runtime.env);
    await requireAdmin(db, request);

    const parsed = RedeemVoucherSchema.safeParse(await request.json());
    if (!parsed.success) return json({ error: "voucherId required" }, 400);

    const result = await redeemVoucher(db, parsed.data.voucherId);
    if (!result.ok) {
      const { status, message } = REASONS[result.reason];
      return json({ error: message, reason: result.reason }, status);
    }
    return json({ message: "Voucher redeemed", voucher: toAdminVoucherView(result.voucher) });
  } catch (e) {
    return handleError(e);
  }
};
