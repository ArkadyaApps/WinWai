import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";
import { getDb } from "../../../lib/db/client";
import { users } from "../../../db/schema";
import { createSession, isAdminEmail, isValidGoogleAudience } from "../../../lib/auth";
import { json, handleError } from "../../../lib/respond";
import { GoogleSignInSchema } from "../../../lib/validations/auth";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = locals.runtime.env;
    const db = getDb(env);

    const body = GoogleSignInSchema.safeParse(await request.json());
    if (!body.success) return json({ error: "id_token required" }, 400);
    const { id_token } = body.data;

    const verifyResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${id_token}`);
    if (!verifyResponse.ok) {
      return json({ error: "Invalid Google ID token", debug: { step: "tokeninfo_http", status: verifyResponse.status, body: await verifyResponse.text() } }, 401);
    }
    const tokenInfo = (await verifyResponse.json()) as Record<string, string>;

    if (tokenInfo.error) {
      return json({ error: "Invalid Google ID token", debug: { step: "tokeninfo_error", tokenInfo } }, 401);
    }

    // Confirm this token was actually issued for our app, not some other
    // Google OAuth client.
    if (!isValidGoogleAudience(tokenInfo.aud, env)) {
      return json({ error: "Invalid token audience", debug: { step: "audience", aud: tokenInfo.aud, configured: env.GOOGLE_CLIENT_ID } }, 401);
    }

    const email = tokenInfo.email;
    if (!email) return json({ error: "Email not found in token", debug: { step: "email", tokenInfo } }, 401);
    const name = tokenInfo.name || email.split("@")[0];
    const picture = tokenInfo.picture ?? null;

    let user = await db.query.users.findFirst({ where: eq(users.email, email) });

    if (!user) {
      const role = isAdminEmail(email, env) ? "admin" : "user";
      const newUser = {
        id: crypto.randomUUID(),
        email,
        name,
        picture,
        tickets: 0, // new users start with 0, unlike the 50-ticket schema default for seed/admin-created accounts
        role,
        lastLogin: new Date(),
      };
      await db.insert(users).values(newUser);
      user = await db.query.users.findFirst({ where: eq(users.id, newUser.id) });
    } else {
      await db.update(users).set({ lastLogin: new Date() }).where(eq(users.id, user.id));
    }
    if (!user) return json({ error: "Failed to create user" }, 500);

    const { sessionToken } = await createSession(db, user.id);

    const { passwordHash, resetToken, resetTokenExpiry, ...safeUser } = user;
    return json({ user: safeUser, session_token: sessionToken });
  } catch (e) {
    return handleError(e);
  }
};
