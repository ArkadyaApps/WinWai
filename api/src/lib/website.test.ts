import { describe, expect, it } from "vitest";
import { CreatePartnerSchema, UpdatePartnerSchema } from "./validations/admin";

const base = { name: "Cafe", description: "Coffee", category: "food" };
const parseWebsite = (website: unknown) => CreatePartnerSchema.safeParse({ ...base, website });

describe("partner website validation", () => {
  it("adds https:// to a bare domain", () => {
    const r = parseWebsite("example.com/menu");
    expect(r.success && r.data.website).toBe("https://example.com/menu");
  });

  it("keeps an explicit http(s) URL as typed (trimmed)", () => {
    expect(parseWebsite("  http://shop.example.co.th/a?b=1 ").success && parseWebsite("  http://shop.example.co.th/a?b=1 ").data?.website).toBe("http://shop.example.co.th/a?b=1");
  });

  it("treats an empty string as no website", () => {
    const r = parseWebsite("");
    expect(r.success && r.data.website).toBeNull();
  });

  it("allows the field to be omitted or null", () => {
    expect(CreatePartnerSchema.safeParse(base).success).toBe(true);
    expect(parseWebsite(null).success).toBe(true);
  });

  it("rejects non-web schemes and junk", () => {
    expect(parseWebsite("javascript:alert(1)").success).toBe(false);
    expect(parseWebsite("data:text/html,<script>1</script>").success).toBe(false);
    expect(parseWebsite("ftp://example.com").success).toBe(false);
    expect(parseWebsite("not a url").success).toBe(false);
  });

  it("rejects an oversized value", () => {
    expect(parseWebsite(`https://example.com/${"a".repeat(400)}`).success).toBe(false);
  });

  it("leaves website untouched on a partial update that omits it", () => {
    const r = UpdatePartnerSchema.safeParse({ name: "New name" });
    expect(r.success && "website" in r.data).toBe(false);
  });

  it("clears the website on an update that sends an empty string", () => {
    const r = UpdatePartnerSchema.safeParse({ website: "" });
    expect(r.success && r.data.website).toBeNull();
  });
});
