import type { APIRoute } from "astro";
import { and, eq } from "drizzle-orm";
import { getDb } from "../../../lib/db/client";
import { users } from "../../../db/schema";
import { hashPassword } from "../../../lib/auth";
import { json, handleError } from "../../../lib/respond";
import { ResetPasswordSchema } from "../../../lib/validations/auth";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = getDb(locals.runtime.env);

    const parsed = ResetPasswordSchema.safeParse(await request.json());
    if (!parsed.success) return json({ error: parsed.error.issues[0].message }, 400);
    const { email, resetToken, newPassword } = parsed.data;

    const user = await db.query.users.findFirst({
      where: and(eq(users.email, email), eq(users.resetToken, resetToken)),
    });
    if (!user) return json({ error: "Invalid or expired reset token" }, 400);
    if (user.resetTokenExpiry && user.resetTokenExpiry.getTime() < Date.now()) {
      return json({ error: "Reset token has expired" }, 400);
    }

    await db
      .update(users)
      .set({ passwordHash: await hashPassword(newPassword), resetToken: null, resetTokenExpiry: null })
      .where(eq(users.id, user.id));

    return json({ message: "Password reset successfully" });
  } catch (e) {
    return handleError(e);
  }
};
