import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";
import { getDb } from "../../../lib/db/client";
import { users } from "../../../db/schema";
import { generateResetToken } from "../../../lib/auth";
import { sendPasswordResetEmail } from "../../../lib/resend";
import { json, handleError } from "../../../lib/respond";
import { ForgotPasswordSchema } from "../../../lib/validations/auth";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = locals.runtime.env;
    const db = getDb(env);

    const parsed = ForgotPasswordSchema.safeParse(await request.json());
    if (!parsed.success) return json({ error: "Invalid request" }, 400);
    const { email } = parsed.data;

    // Always return the same generic message regardless of whether the
    // account exists or has a password - never reveal that via the response,
    // and never return the token itself here (send it by email only).
    const genericResponse = { message: "If the email exists, a reset link will be sent" };

    const user = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (!user || !user.passwordHash) return json(genericResponse);

    const resetToken = generateResetToken();
    const resetTokenExpiry = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await db.update(users).set({ resetToken, resetTokenExpiry }).where(eq(users.id, user.id));

    const resetLink = `${env.APP_URL}/reset-password?email=${encodeURIComponent(email)}&resetToken=${resetToken}`;
    await sendPasswordResetEmail(env, email, resetLink);

    return json(genericResponse);
  } catch (e) {
    return handleError(e);
  }
};
