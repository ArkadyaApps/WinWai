// Calls the Resend REST API directly with fetch instead of the `resend` SDK -
// the SDK pulls in @react-email/render (which requires `react`), which
// doesn't bundle for the Cloudflare Workers runtime and isn't needed since
// we only send raw HTML strings.
async function sendEmail(
  apiKey: string,
  params: { from: string; to: string[]; subject: string; html: string }
): Promise<void> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    throw new Error(`Resend API error (${response.status}): ${await response.text()}`);
  }
}

export async function sendPasswordResetEmail(env: { RESEND_API_KEY?: string }, to: string, resetLink: string): Promise<void> {
  if (!env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not configured - password reset email not sent");
    return;
  }
  try {
    await sendEmail(env.RESEND_API_KEY, {
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

export { sendEmail };
