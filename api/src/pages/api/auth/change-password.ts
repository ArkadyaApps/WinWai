import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";
import { getDb } from "../../../lib/db/client";
import { users } from "../../../db/schema";
import { hashPassword, requireUser, verifyPassword } from "../../../lib/auth";
import { json, handleError } from "../../../lib/respond";
import { ChangePasswordSchema } from "../../../lib/validations/auth";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = getDb(locals.runtime.env);
    const user = await requireUser(db, request);

    const parsed = ChangePasswordSchema.safeParse(await request.json());
    if (!parsed.success) return json({ error: parsed.error.issues[0].message }, 400);
    const { currentPassword, newPassword } = parsed.data;

    if (!user.passwordHash) return json({ error: "Cannot change password for OAuth accounts" }, 400);
    if (!(await verifyPassword(currentPassword, user.passwordHash))) {
      return json({ error: "Current password is incorrect" }, 401);
    }

    await db.update(users).set({ passwordHash: await hashPassword(newPassword) }).where(eq(users.id, user.id));
    return json({ message: "Password changed successfully" });
  } catch (e) {
    return handleError(e);
  }
};
