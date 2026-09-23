import type { APIRoute } from "astro";
import { sendEmail } from "../../lib/resend";
import { json, handleError, escapeHtml } from "../../lib/respond";
import { PartnerInquirySchema } from "../../lib/validations/partnerInquiry";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = locals.runtime.env;
    const parsed = PartnerInquirySchema.safeParse(await request.json());
    if (!parsed.success) return json({ error: "All fields are required" }, 400);
    const { brand, product, name, phone } = parsed.data;

    if (!env.RESEND_API_KEY || env.RESEND_API_KEY === "re_placeholder_key") {
      return json({ error: "Email service not configured" }, 500);
    }

    try {
      await sendEmail(env.RESEND_API_KEY, {
        from: "WinWai Partner Inquiry <noreply@winwai.online>",
        to: ["Contact@winwai.online"],
        subject: `New Partner Inquiry: ${brand}`,
        html: `
          <h2>New Partner Inquiry</h2>
          <p><strong>Brand/Business:</strong> ${escapeHtml(brand)}</p>
          <p><strong>Product/Service:</strong> ${escapeHtml(product)}</p>
          <p><strong>Contact Name:</strong> ${escapeHtml(name)}</p>
          <p><strong>Phone Number:</strong> ${escapeHtml(phone)}</p>
          <br>
          <p><em>Sent from WinWai Raffle App</em></p>
        `,
      });
    } catch (e) {
      console.error("Error sending partner inquiry email:", e);
      return json({ error: "Failed to send inquiry. Please try again." }, 500);
    }

    return json({ success: true, message: "Thank you! We'll contact you soon." });
  } catch (e) {
    return handleError(e);
  }
};
