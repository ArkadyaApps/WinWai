import type { APIRoute } from "astro";
import { eq, like, sql } from "drizzle-orm";
import { getDb } from "../../../lib/db/client";
import { users } from "../../../db/schema";
import { requireUser } from "../../../lib/auth";
import { json, handleError } from "../../../lib/respond";
import { RedeemReferralSchema } from "../../../lib/validations/user";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = getDb(locals.runtime.env);
    const user = await requireUser(db, request);

    const parsed = RedeemReferralSchema.safeParse(await request.json());
    if (!parsed.success) return json({ error: "Referral code is required" }, 400);
    const referralCode = parsed.data.code.trim().toUpperCase();
    if (!referralCode) return json({ error: "Referral code is required" }, 400);

    if (user.usedReferralCode) {
      return json({ error: "You have already redeemed a referral code" }, 400);
    }

    const referrer = await db.query.users.findFirst({
      where: like(users.id, `${referralCode.slice(0, 8)}%`),
    });
    if (!referrer) return json({ error: "Invalid referral code" }, 404);
    if (referrer.id === user.id) return json({ error: "You cannot use your own referral code" }, 400);

    await db.batch([
      db
        .update(users)
        .set({ tickets: sql`${users.tickets} + 1`, usedReferralCode: true, referredBy: referrer.id })
        .where(eq(users.id, user.id)),
      db.update(users).set({ tickets: sql`${users.tickets} + 1` }).where(eq(users.id, referrer.id)),
    ]);

    return json({ success: true, message: "Referral code redeemed! You both earned 1 ticket", ticketsEarned: 1 });
  } catch (e) {
    return handleError(e);
  }
};
