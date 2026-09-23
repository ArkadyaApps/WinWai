import type { APIRoute } from "astro";
import { and, eq, ne } from "drizzle-orm";
import { getDb } from "../../../../lib/db/client";
import { users } from "../../../../db/schema";
import { requireUser } from "../../../../lib/auth";
import { json, handleError } from "../../../../lib/respond";
import { UpdateProfileSchema } from "../../../../lib/validations/user";

export const PUT: APIRoute = async ({ request, locals }) => {
  try {
    const db = getDb(locals.runtime.env);
    const user = await requireUser(db, request);

    const parsed = UpdateProfileSchema.safeParse(await request.json());
    if (!parsed.success) return json({ error: parsed.error.issues[0].message }, 400);
    const { name, email, phone } = parsed.data;

    const updateData: Partial<typeof users.$inferInsert> = {};
    if (name) updateData.name = name;
    if (email) {
      const existing = await db.query.users.findFirst({
        where: and(eq(users.email, email), ne(users.id, user.id)),
      });
      if (existing) return json({ error: "Email already in use" }, 400);
      updateData.email = email;
    }
    if (phone !== undefined) updateData.phone = phone;

    if (Object.keys(updateData).length > 0) {
      await db.update(users).set(updateData).where(eq(users.id, user.id));
    }

    const updatedUser = await db.query.users.findFirst({ where: eq(users.id, user.id) });
    const { passwordHash, resetToken, resetTokenExpiry, ...safeUser } = updatedUser!;
    return json(safeUser);
  } catch (e) {
    return handleError(e);
  }
};
