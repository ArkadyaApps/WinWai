import { Resend } from "resend";

export async function sendPasswordResetEmail(env: { RESEND_API_KEY?: string }, to: string, resetLink: string): Promise<void> {
  if (!env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not configured - password reset email not sent");
    return;
  }
  const resend = new Resend(env.RESEND_API_KEY);
  try {
    await resend.emails.send({
      from: "WinWai <noreply@winwai.online>",
      to: [to],
      subject: "Reset your WinWai password",
      html: `
        <h2>Reset your password</h2>
        <p>Tap the link below to reset your password. This link expires in 1 hour.</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <p>If you didn't request this, you can ignore this email.</p>
      `,
    });
  } catch (e) {
    console.error(`Failed to send password reset email to ${to}:`, e);
  }
}
