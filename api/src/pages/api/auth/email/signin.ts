import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";
import { getDb } from "../../../../lib/db/client";
import { users } from "../../../../db/schema";
import { createSession, hashPassword, isLegacySha256Hash, verifyPassword } from "../../../../lib/auth";
import { json, handleError } from "../../../../lib/respond";
import { EmailSignInSchema } from "../../../../lib/validations/auth";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = getDb(locals.runtime.env);

    const parsed = EmailSignInSchema.safeParse(await request.json());
    if (!parsed.success) return json({ error: "Invalid request" }, 400);
    const { email, password } = parsed.data;

    const user = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (!user) return json({ error: "Invalid email or password" }, 401);
    if (!user.passwordHash) return json({ error: "Please sign in with Google" }, 401);
    if (!(await verifyPassword(password, user.passwordHash))) {
      return json({ error: "Invalid email or password" }, 401);
    }

    const updates: Partial<typeof users.$inferInsert> = { lastLogin: new Date() };
    if (isLegacySha256Hash(user.passwordHash)) {
      updates.passwordHash = await hashPassword(password);
    }
    await db.update(users).set(updates).where(eq(users.id, user.id));

    const { sessionToken } = await createSession(db, user.id);
    const { passwordHash, resetToken, resetTokenExpiry, ...safeUser } = user;
    return json({ user: safeUser, session_token: sessionToken });
  } catch (e) {
    return handleError(e);
  }
};
