import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";
import { getDb } from "../../../../lib/db/client";
import { raffles } from "../../../../db/schema";
import { requireAdmin } from "../../../../lib/auth";
import { json, handleError } from "../../../../lib/respond";
import { UploadSecretCodesSchema } from "../../../../lib/validations/admin";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = getDb(locals.runtime.env);
    await requireAdmin(db, request);

    const parsed = UploadSecretCodesSchema.safeParse(await request.json());
    if (!parsed.success) return json({ error: parsed.error.issues[0].message }, 400);
    const { raffleId, secretCodes } = parsed.data;

    const raffle = await db.query.raffles.findFirst({ where: eq(raffles.id, raffleId) });
    if (!raffle) return json({ error: "Raffle not found" }, 404);

    const cleanedCodes = [...new Set(secretCodes.map((c) => c.trim()).filter(Boolean))];
    if (cleanedCodes.length === 0) return json({ error: "No valid codes provided" }, 400);

    await db.update(raffles).set({ secretCodes: cleanedCodes, isDigitalPrize: true }).where(eq(raffles.id, raffleId));

    return json({ success: true, message: `Uploaded ${cleanedCodes.length} secret codes`, codesCount: cleanedCodes.length });
  } catch (e) {
    return handleError(e);
  }
};
