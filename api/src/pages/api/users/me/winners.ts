import type { APIRoute } from "astro";
import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../../lib/db/client";
import { raffles, vouchers, winners } from "../../../../db/schema";
import { requireUser } from "../../../../lib/auth";
import { json, handleError } from "../../../../lib/respond";

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const db = getDb(locals.runtime.env);
    const user = await requireUser(db, request);

    const myWinners = await db
      .select()
      .from(winners)
      .where(eq(winners.userId, user.id))
      .orderBy(desc(winners.createdAt))
      .limit(100);

    const enriched = await Promise.all(
      myWinners.map(async (winner) => {
        const [voucher, raffle] = await Promise.all([
          db.query.vouchers.findFirst({ where: eq(vouchers.id, winner.voucherId) }),
          db.query.raffles.findFirst({ where: eq(raffles.id, winner.raffleId) }),
        ]);
        return {
          ...winner,
          voucher: voucher ?? null,
          raffle: raffle
            ? { title: raffle.title, category: raffle.category, image: raffle.image }
            : null,
        };
      })
    );

    return json(enriched);
  } catch (e) {
    return handleError(e);
  }
};
