import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";
import { getDb } from "../../../../lib/db/client";
import { users } from "../../../../db/schema";
import { requireAdmin } from "../../../../lib/auth";
import { json, handleError } from "../../../../lib/respond";
import { UpdateUserSchema } from "../../../../lib/validations/admin";

export const PUT: APIRoute = async ({ request, params, locals }) => {
  try {
    const db = getDb(locals.runtime.env);
    await requireAdmin(db, request);
    const userId = params.id!;

    const parsed = UpdateUserSchema.safeParse(await request.json());
    if (!parsed.success) return json({ error: parsed.error.issues[0].message }, 400);
    const updateData = Object.fromEntries(Object.entries(parsed.data).filter(([, v]) => v !== undefined));

    if (Object.keys(updateData).length > 0) {
      const result = await db.update(users).set(updateData).where(eq(users.id, userId)).returning({ id: users.id });
      if (result.length === 0) return json({ error: "User not found" }, 404);
    }

    const updated = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!updated) return json({ error: "User not found" }, 404);
    const { passwordHash, resetToken, resetTokenExpiry, ...safeUser } = updated;
    return json(safeUser);
  } catch (e) {
    return handleError(e);
  }
};

export const DELETE: APIRoute = async ({ request, params, locals }) => {
  try {
    const db = getDb(locals.runtime.env);
    const admin = await requireAdmin(db, request);
    const userId = params.id!;

    if (userId === admin.id) return json({ error: "Cannot delete your own account" }, 400);

    const result = await db.delete(users).where(eq(users.id, userId)).returning({ id: users.id });
    if (result.length === 0) return json({ error: "User not found" }, 404);

    return json({ message: "User deleted successfully" });
  } catch (e) {
    return handleError(e);
  }
};
