// Calls the Resend REST API directly with fetch instead of the `resend` SDK -
// the SDK pulls in @react-email/render (which requires `react`), which
// doesn't bundle for the Cloudflare Workers runtime and isn't needed since
// we only send raw HTML strings.
const RESEND_API_URL = "https://api.resend.com/emails";

async function sendEmail(
  apiKey: string,
  params: { from: string; to: string[]; subject: string; html: string },
  apiUrl: string = RESEND_API_URL
): Promise<void> {
  const response = await fetch(apiUrl, {
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

// ---------------------------------------------------------------------------
// Winner notification. Deliberately PARTIAL: email is not a secure channel, so
// it names the prize and a masked reference but never the full voucher
// reference or the verification code - those are only shown inside the app
// (Rewards tab) after signing in.
// ---------------------------------------------------------------------------

export interface WinnerEmailInput {
  to: string;
  name: string;
  raffleTitle: string;
  partnerName: string;
  validUntil: Date;
  voucherRef: string;
  /** Language the raffle is written in (en | th | fr | ar); anything else falls back to English. */
  lang: string;
  appUrl: string;
}

/** "WW-2026-12345" -> "WW-2026-***45": the last group keeps only its final two characters. */
export function maskVoucherRef(ref: string): string {
  return ref.replace(/[0-9A-Za-z]+$/, (last) => `***${last.slice(-2)}`);
}

const escapeHtml = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

interface WinnerCopy {
  subject: (title: string) => string;
  hello: (name: string) => string;
  won: (title: string, partner: string) => string;
  valid: (date: string) => string;
  ref: (masked: string) => string;
  secure: string;
  cta: string;
  rtl?: boolean;
}

const WINNER_COPY: Record<string, WinnerCopy> = {
  en: {
    subject: (t) => `You won: ${t}!`,
    hello: (n) => `Hi ${n},`,
    won: (t, p) => `Congratulations! You won <strong>${t}</strong> from ${p}.`,
    valid: (d) => `Your voucher is valid until ${d}.`,
    ref: (m) => `Reference: ${m}`,
    secure: "For your security the full voucher code is not shown in this email. Open WinWai and go to the Rewards tab to see it.",
    cta: "Open WinWai",
  },
  th: {
    subject: (t) => `ยินดีด้วย! คุณได้รับรางวัล: ${t}`,
    hello: (n) => `สวัสดีคุณ ${n}`,
    won: (t, p) => `ขอแสดงความยินดี! คุณได้รับรางวัล <strong>${t}</strong> จาก ${p}`,
    valid: (d) => `บัตรรางวัลของคุณใช้ได้ถึงวันที่ ${d}`,
    ref: (m) => `เลขอ้างอิง: ${m}`,
    secure: "เพื่อความปลอดภัย อีเมลนี้ไม่แสดงรหัสบัตรรางวัลฉบับเต็ม กรุณาเปิดแอป WinWai แล้วไปที่แท็บรางวัลของฉันเพื่อดูรหัส",
    cta: "เปิด WinWai",
  },
  fr: {
    subject: (t) => `Vous avez gagné : ${t} !`,
    hello: (n) => `Bonjour ${n},`,
    won: (t, p) => `Félicitations ! Vous avez gagné <strong>${t}</strong> chez ${p}.`,
    valid: (d) => `Votre bon est valable jusqu'au ${d}.`,
    ref: (m) => `Référence : ${m}`,
    secure: "Par sécurité, le code complet du bon n'apparaît pas dans cet e-mail. Ouvrez WinWai et allez dans l'onglet Récompenses pour le voir.",
    cta: "Ouvrir WinWai",
  },
  ar: {
    subject: (t) => `لقد فزت: ${t}!`,
    hello: (n) => `مرحبًا ${n}،`,
    won: (t, p) => `تهانينا! لقد فزت بـ <strong>${t}</strong> من ${p}.`,
    valid: (d) => `قسيمتك صالحة حتى ${d}.`,
    ref: (m) => `المرجع: ${m}`,
    secure: "لأمانك، لا يظهر رمز القسيمة الكامل في هذه الرسالة. افتح WinWai وانتقل إلى تبويب المكافآت لعرضه.",
    cta: "افتح WinWai",
    rtl: true,
  },
};

export function buildWinnerEmail(input: WinnerEmailInput): { subject: string; html: string } {
  const copy = WINNER_COPY[input.lang] ?? WINNER_COPY.en;
  const title = escapeHtml(input.raffleTitle);
  const partner = escapeHtml(input.partnerName);
  const name = escapeHtml(input.name);
  const date = input.validUntil.toISOString().slice(0, 10);
  const html = `
    <div${copy.rtl ? ' dir="rtl"' : ""} style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:520px;margin:0 auto;color:#2C3E50;line-height:1.5">
      <p>${copy.hello(name)}</p>
      <p>${copy.won(title, partner)}</p>
      <p>${copy.valid(date)}<br>${escapeHtml(copy.ref(maskVoucherRef(input.voucherRef)))}</p>
      <p style="color:#7F8C8D">${copy.secure}</p>
      <p><a href="${escapeHtml(input.appUrl)}" style="display:inline-block;background:#FFD700;color:#000;font-weight:700;padding:12px 24px;border-radius:24px;text-decoration:none">${copy.cta}</a></p>
    </div>`;
  return { subject: copy.subject(input.raffleTitle), html };
}

export interface WinnerEmailEnv {
  RESEND_API_KEY?: string;
  APP_URL?: string;
  /** Test hook: point at a local mock instead of api.resend.com. */
  RESEND_API_URL?: string;
}

/** Best-effort: resolves true only if the email was actually accepted for sending. */
export async function sendWinnerEmail(env: WinnerEmailEnv, input: Omit<WinnerEmailInput, "appUrl">): Promise<boolean> {
  if (!env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not configured - winner email not sent");
    return false;
  }
  try {
    const { subject, html } = buildWinnerEmail({ ...input, appUrl: env.APP_URL ?? "https://winwai.online" });
    await sendEmail(env.RESEND_API_KEY, { from: "WinWai <noreply@winwai.online>", to: [input.to], subject, html }, env.RESEND_API_URL);
    return true;
  } catch (e) {
    console.error(`Failed to send winner email to ${input.to}:`, e);
    return false;
  }
}

/** Draw hook that emails the winner; undefined when no email key is configured. */
export function createWinnerNotifier(env: WinnerEmailEnv) {
  if (!env.RESEND_API_KEY) return undefined;
  return (w: Omit<WinnerEmailInput, "appUrl">) => sendWinnerEmail(env, w);
}

export { sendEmail };
