/**
 * ALL company facts and shop rules used by the legal and info pages, the footer and the sitemap.
 * Fill in every "[TO FILL: …]" value before launch. Nothing here was invented:
 * while a value starts with "[", the pages show a "missing details" note.
 */
export const COMPANY = {
  tradingName: "BestDoors",
  legalName: "[TO FILL: company legal name, e.g. BestDoors Ltd]",
  address: "[TO FILL: registered address, with Eircode]",
  croNumber: "[TO FILL: CRO number]",
  vatNumber: "[TO FILL: VAT number, e.g. IE1234567X]",
  email: "[TO FILL: customer email, e.g. hello@bestdoors.ie]",
  phone: "[TO FILL: phone number]",
  openingHours: "[TO FILL: e.g. Mon–Fri 9:00–17:00]",
  story: "[TO FILL: a few sentences about the company: since when, who you are, where the doors are made]",

  /** Shop rules (shown on the delivery and returns pages). */
  deliveryAreas: "[TO FILL: where you deliver, e.g. all of Ireland]",
  deliveryTime: "[TO FILL: usual delivery time, e.g. 2–4 weeks after payment]",
  deliveryCost: "Free", // matches SHIPPING_EUR = 0 in apps/api/src/services/order.service.ts
  returnShipping: "[TO FILL: who pays to send a cancelled door back, and how it is collected]",
  customDoorsRule:
    "[TO FILL: your rule for made-to-measure doors (the law allows excluding them from the 14-day cancellation right)]",
  dataRetention: "[TO FILL: how long you keep quote requests and accounts, e.g. quotes 2 years, accounts until deleted]",

  /** Set to true after a lawyer has checked the privacy, terms and returns texts. */
  legalReviewed: false,
  /** Date shown as "last updated" on the legal pages (YYYY-MM-DD). */
  legalUpdated: "2026-11-05",
};

export type Company = typeof COMPANY;

export const isPlaceholder = (value: unknown) => typeof value === "string" && value.startsWith("[");

/** Names of the facts that are still placeholders (for the "missing details" note). */
export function missingCompanyFacts(): string[] {
  return Object.entries(COMPANY)
    .filter(([, v]) => isPlaceholder(v))
    .map(([k]) => k);
}
