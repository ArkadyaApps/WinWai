import type { APIRoute } from "astro";
import { eq, like, sql } from "drizzle-orm";
import { getDb } from "../../../../lib/db/client";
import { users } from "../../../../db/schema";
import { createSession, hashPassword, isAdminEmail } from "../../../../lib/auth";
import { json, handleError } from "../../../../lib/respond";
import { EmailSignUpSchema } from "../../../../lib/validations/auth";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = locals.runtime.env;
    const db = getDb(env);

    const parsed = EmailSignUpSchema.safeParse(await request.json());
    if (!parsed.success) return json({ error: parsed.error.issues[0].message }, 400);
    const { email, password, name, referralCode } = parsed.data;

    const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (existing) return json({ error: "Email already registered" }, 400);

    let welcomeTickets = 0;
    let referrerId: string | null = null;
    if (referralCode) {
      const referrer = await db.query.users.findFirst({ where: like(users.id, `${referralCode}%`) });
      if (referrer) {
        referrerId = referrer.id;
        welcomeTickets = 1;
      }
    }

    const passwordHash = await hashPassword(password);
    const role = isAdminEmail(email, env) ? "admin" : "user";
    const newUser = {
      id: crypto.randomUUID(),
      email,
      name,
      passwordHash,
      tickets: welcomeTickets,
      role,
      lastLogin: new Date(),
    };
    await db.insert(users).values(newUser);

    if (referrerId) {
      await db.update(users).set({ tickets: sql`${users.tickets} + 1` }).where(eq(users.id, referrerId));
    }

    const { sessionToken } = await createSession(db, newUser.id);
    const user = await db.query.users.findFirst({ where: eq(users.id, newUser.id) });
    if (!user) return json({ error: "Failed to create user" }, 500);

    const { passwordHash: _ph, resetToken, resetTokenExpiry, ...safeUser } = user;
    return json({ user: safeUser, session_token: sessionToken });
  } catch (e) {
    return handleError(e);
  }
};
