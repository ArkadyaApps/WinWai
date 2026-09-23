import type { APIRoute } from "astro";
import { and, desc, eq, like, or } from "drizzle-orm";
import { getDb } from "../../../../lib/db/client";
import { partners } from "../../../../db/schema";
import { requireAdmin } from "../../../../lib/auth";
import { json, handleError } from "../../../../lib/respond";
import { CreatePartnerSchema } from "../../../../lib/validations/admin";

export const GET: APIRoute = async ({ request, url, locals }) => {
  try {
    const db = getDb(locals.runtime.env);
    await requireAdmin(db, request);

    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const limit = Number(url.searchParams.get("limit") ?? 20);
    const q = url.searchParams.get("q");
    const category = url.searchParams.get("category");
    const offset = (page - 1) * limit;

    const conditions = [];
    if (q) conditions.push(or(like(partners.name, `%${q}%`), like(partners.description, `%${q}%`)));
    if (category && ["food", "hotel", "spa"].includes(category)) conditions.push(eq(partners.category, category));

    const results = await db
      .select()
      .from(partners)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(partners.createdAt))
      .limit(limit)
      .offset(offset);

    return json(results);
  } catch (e) {
    return handleError(e);
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = getDb(locals.runtime.env);
    await requireAdmin(db, request);

    const parsed = CreatePartnerSchema.safeParse(await request.json());
    if (!parsed.success) return json({ error: parsed.error.issues[0].message }, 400);

    const newPartner = { id: crypto.randomUUID(), ...parsed.data };
    await db.insert(partners).values(newPartner);
    return json(newPartner);
  } catch (e) {
    return handleError(e);
  }
};
