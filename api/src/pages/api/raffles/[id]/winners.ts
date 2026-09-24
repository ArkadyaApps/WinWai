import type { APIRoute } from "astro";
import { asc, eq } from "drizzle-orm";
import { getDb } from "../../../../lib/db/client";
import { vouchers, winners } from "../../../../db/schema";
import { json, handleError } from "../../../../lib/respond";
import { anonymousWinnerId } from "../../../../lib/raffleHelpers";

// Public winners list. Deliberately exposes no user data at all: only the
// round, the draw time, and an opaque ID derived from the voucher reference.
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const db = getDb(locals.runtime.env);
    const raffleId = params.id!;
    const rows = await db
      .select({ round: winners.round, drawDate: winners.drawDate, voucherRef: vouchers.voucherRef })
      .from(winners)
      .innerJoin(vouchers, eq(winners.voucherId, vouchers.id))
      .where(eq(winners.raffleId, raffleId))
      .orderBy(asc(winners.round));

    const result = await Promise.all(
      rows.map(async (r) => ({ round: r.round, drawnAt: r.drawDate, anonymousId: await anonymousWinnerId(r.voucherRef, raffleId) }))
    );
    return json(result);
  } catch (e) {
    return handleError(e);
  }
};
