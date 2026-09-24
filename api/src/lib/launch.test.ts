import { describe, expect, it } from "vitest";
import { getSignupBonusTickets, SIGNUP_BONUS_ENDS_AT } from "./promo";
import { buildWinnerEmail, maskVoucherRef } from "./resend";
import { maskEmail } from "./raffleHelpers";

describe("signup bonus (free ticket until 31 Dec 2026, Bangkok time)", () => {
  it("gives 1 ticket during the promo", () => {
    expect(getSignupBonusTickets(new Date("2026-09-24T00:00:00Z"))).toBe(1);
    expect(getSignupBonusTickets(new Date("2026-12-01T12:00:00Z"))).toBe(1);
  });

  it("still applies at 23:59:59.999 on 31 Dec in Bangkok (UTC+7)", () => {
    expect(getSignupBonusTickets(new Date("2026-12-31T16:59:59.999Z"))).toBe(1);
  });

  it("ends exactly at midnight Bangkok time on 1 Jan 2027", () => {
    expect(SIGNUP_BONUS_ENDS_AT.toISOString()).toBe("2026-12-31T17:00:00.000Z");
    expect(getSignupBonusTickets(new Date("2026-12-31T17:00:00.000Z"))).toBe(0);
    expect(getSignupBonusTickets(new Date("2027-06-01T00:00:00Z"))).toBe(0);
  });
});

describe("maskVoucherRef", () => {
  it("keeps the prefix and only the last two characters", () => {
    expect(maskVoucherRef("WW-2026-12345")).toBe("WW-2026-***45");
  });
});

describe("buildWinnerEmail (deliberately partial)", () => {
  const base = {
    to: "w@example.com",
    name: "Somchai",
    raffleTitle: "Free Pizza",
    partnerName: "Bottega Jira",
    validUntil: new Date("2026-12-24T00:00:00Z"),
    voucherRef: "WW-2026-12345",
    lang: "en",
    appUrl: "https://winwai.online",
  };

  it("names the prize, partner, expiry date and a masked reference", () => {
    const { subject, html } = buildWinnerEmail(base);
    expect(subject).toBe("You won: Free Pizza!");
    expect(html).toContain("Free Pizza");
    expect(html).toContain("Bottega Jira");
    expect(html).toContain("2026-12-24");
    expect(html).toContain("WW-2026-***45");
  });

  it("never contains the full reference, and points to the app for the code", () => {
    const { html } = buildWinnerEmail(base);
    expect(html).not.toContain("WW-2026-12345");
    expect(html).not.toContain("12345");
    expect(html).toContain("https://winwai.online");
    expect(html.toLowerCase()).toContain("rewards tab");
  });

  it("escapes HTML in user-controlled text", () => {
    const { html } = buildWinnerEmail({ ...base, raffleTitle: "<script>alert(1)</script>", name: "<b>x</b>" });
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<b>x</b>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("uses the raffle's language, falling back to English", () => {
    expect(buildWinnerEmail({ ...base, lang: "fr" }).subject).toContain("Vous avez gagné");
    expect(buildWinnerEmail({ ...base, lang: "th" }).subject).toContain("ยินดีด้วย");
    expect(buildWinnerEmail({ ...base, lang: "xx" }).subject).toBe("You won: Free Pizza!");
  });

  it("lays Arabic out right-to-left", () => {
    expect(buildWinnerEmail({ ...base, lang: "ar" }).html).toContain('dir="rtl"');
    expect(buildWinnerEmail({ ...base, lang: "en" }).html).not.toContain('dir="rtl"');
  });
});

describe("maskEmail (public winners banner)", () => {
  it("shows only the start of the name, the first letter of the domain and the TLD", () => {
    expect(maskEmail("somchai@gmail.com")).toBe("so***@g***.com");
    expect(maskEmail("ab@x.co")).toBe("a***@x***.co");
    expect(maskEmail("arkadya.properties@my-company.co.th")).toBe("ar***@m***.th");
  });

  it("never reveals more than 2 characters of the local part or 1 of the domain", () => {
    const masked = maskEmail("verylongaddress@example.org");
    expect(masked).not.toContain("verylong");
    expect(masked).not.toContain("example");
  });

  it("returns a placeholder for malformed input", () => {
    expect(maskEmail("not-an-email")).toBe("***");
    expect(maskEmail("@nolocal.com")).toBe("***");
  });
});
