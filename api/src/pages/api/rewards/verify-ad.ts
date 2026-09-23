import type { APIRoute } from "astro";
import { and, eq, gte, sql } from "drizzle-orm";
import { getDb } from "../../../lib/db/client";
import { adRewards, users } from "../../../db/schema";
import { requireUser } from "../../../lib/auth";
import { json, handleError } from "../../../lib/respond";
import { AdRewardSchema } from "../../../lib/validations/adReward";

const MAX_AD_REWARDS_PER_DAY = 20;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = getDb(locals.runtime.env);
    // This client-reported call is only a UX optimism signal, not proof an ad
    // was watched - it must be tied to a real authenticated account (never a
    // client-supplied userId) and rate-limited, since there's no server-side
    // verification callback for it.
    const user = await requireUser(db, request);

    const parsed = AdRewardSchema.safeParse(await request.json());
    if (!parsed.success) return json({ error: "Invalid request" }, 400);
    const { transactionId, timestamp } = parsed.data;

    const existing = await db.query.adRewards.findFirst({ where: eq(adRewards.transactionId, transactionId) });
    if (existing) return json({ error: "Reward already claimed" }, 400);

    if (Math.abs(Date.now() - timestamp) > 300_000) {
      return json({ error: "Reward expired" }, 400);
    }

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recent = await db.query.adRewards.findMany({
      where: and(eq(adRewards.userId, user.id), gte(adRewards.timestamp, since)),
    });
    if (recent.length >= MAX_AD_REWARDS_PER_DAY) {
      return json({ error: "Daily ad reward limit reached" }, 429);
    }

    const ticketsToAward = 1;
    const updated = await db
      .update(users)
      .set({ tickets: sql`${users.tickets} + ${ticketsToAward}` })
      .where(eq(users.id, user.id))
      .returning({ tickets: users.tickets });
    if (updated.length === 0) return json({ error: "User not found" }, 404);

    await db.insert(adRewards).values({
      userId: user.id,
      transactionId,
      tickets: ticketsToAward,
      source: "client",
    });

    return json({ success: true, ticketsAwarded: ticketsToAward, newBalance: updated[0].tickets });
  } catch (e) {
    return handleError(e);
  }
};
