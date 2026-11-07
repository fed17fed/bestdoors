import { describe, expect, it } from "vitest";
import { EIRCODE_REGEX, formatPrice, quoteInputSchema, vatFromGross, optionGroupInputSchema } from "@bestdoors/shared";
import { orderConfirmationEmail } from "../src/emails/order-confirmation";
import { quoteCustomerEmail, quoteShopEmail } from "../src/emails/quote-emails";

describe("money", () => {
  it("VAT part of a VAT-inclusive price (23%)", () => {
    expect(vatFromGross(123)).toBe(23);
    expect(vatFromGross(1290)).toBe(241.22);
    expect(vatFromGross(0)).toBe(0);
  });
  it("formats euro", () => {
    expect(formatPrice(1290, "en")).toBe("€1,290.00");
  });
});

describe("Eircode", () => {
  it.each(["D02 X285", "d02x285", "H91 E2K3", "D6W 1234", "A65 F4E2"])("accepts %s", (v) => {
    expect(EIRCODE_REGEX.test(v)).toBe(true);
  });
  it.each(["H91 AB12", "12345", "D02 X28", "B12 3456", ""])("rejects %s", (v) => {
    expect(EIRCODE_REGEX.test(v)).toBe(false);
  });
  it("the quote form normalises it to upper case with a space", () => {
    const q = quoteInputSchema.parse({ name: "Ann", email: "A@B.ie", doorType: "INTERIOR", eircode: "d02x285" });
    expect(q.eircode).toBe("D02 X285");
    expect(q.email).toBe("a@b.ie");
  });
});

describe("option group schema", () => {
  const value = (code: string, isDefault = false) => ({ code, isDefault, translations: [{ locale: "en", label: code }] });
  const base = { translations: [{ locale: "en", name: "Glass" }] };
  it("needs English names, unique codes and at most one default", () => {
    expect(optionGroupInputSchema.safeParse({ ...base, values: [value("a", true), value("b")] }).success).toBe(true);
    expect(optionGroupInputSchema.safeParse({ ...base, values: [value("a", true), value("b", true)] }).success).toBe(false);
    expect(optionGroupInputSchema.safeParse({ ...base, values: [value("a"), value("a")] }).success).toBe(false);
    expect(optionGroupInputSchema.safeParse({ translations: [{ locale: "uk", name: "Glass" }], values: [value("a")] }).success).toBe(false);
  });
});

describe("emails are safe against HTML injection", () => {
  const evil = `<script>alert("x")</script>`;

  it("order email escapes product names and address", () => {
    const mail = orderConfirmationEmail({
      number: 7, locale: "en", email: "a@b.ie", createdAt: new Date("2026-11-05"),
      subtotal: 100, vatAmount: 18.7, shipping: 0, total: 100,
      items: [{ productName: evil, options: [{ group: "Colour", value: evil }], quantity: 1, unitPrice: 100 }],
      shippingAddress: { name: evil, line1: "1 Main St", line2: "", city: "Cork", county: "", postalCode: "T12 X5Y6", country: "IE", phone: "" },
    });
    expect(mail.html).not.toContain("<script>");
    expect(mail.html).toContain("&lt;script&gt;");
    expect(mail.text).toContain("Free"); // free delivery in the plain-text version
  });

  it("quote emails escape customer text; the shop email replies to the customer", () => {
    const data = {
      reference: "Q-ABC123", name: evil, email: "c@d.ie", phone: "", doorType: "EXTERIOR" as const,
      widthMm: 900, heightMm: null, eircode: "", message: `${evil}\nsecond line`, photos: [], productName: null, locale: "en" as const,
    };
    const shop = quoteShopEmail(data, "shop@bestdoors.ie");
    const customer = quoteCustomerEmail(data);
    for (const m of [shop, customer]) {
      expect(m.html).not.toContain("<script>");
      expect(m.html).toContain("&lt;script&gt;");
    }
    expect(shop.replyTo).toBe("c@d.ie");
    expect(customer.html).toContain("900 × ? mm");
    expect(customer.subject).toContain("Q-ABC123");
  });
});
