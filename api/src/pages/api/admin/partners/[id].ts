import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";
import { getDb } from "../../../../lib/db/client";
import { partners } from "../../../../db/schema";
import { requireAdmin } from "../../../../lib/auth";
import { json, handleError } from "../../../../lib/respond";
import { UpdatePartnerSchema } from "../../../../lib/validations/admin";

export const PUT: APIRoute = async ({ request, params, locals }) => {
  try {
    const db = getDb(locals.runtime.env);
    await requireAdmin(db, request);
    const partnerId = params.id!;

    const parsed = UpdatePartnerSchema.safeParse(await request.json());
    if (!parsed.success) return json({ error: parsed.error.issues[0].message }, 400);

    const result = await db
      .update(partners)
      .set(parsed.data)
      .where(eq(partners.id, partnerId))
      .returning();
    if (result.length === 0) return json({ error: "Partner not found" }, 404);

    return json(result[0]);
  } catch (e) {
    return handleError(e);
  }
};

export const DELETE: APIRoute = async ({ request, params, locals }) => {
  try {
    const db = getDb(locals.runtime.env);
    await requireAdmin(db, request);
    const partnerId = params.id!;

    const result = await db.delete(partners).where(eq(partners.id, partnerId)).returning({ id: partners.id });
    if (result.length === 0) return json({ error: "Partner not found" }, 404);

    return json({ message: "Partner deleted successfully" });
  } catch (e) {
    return handleError(e);
  }
};
