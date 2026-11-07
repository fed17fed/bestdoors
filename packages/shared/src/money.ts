import { INTL_LOCALE, type Locale } from "./locales";

/** Irish standard VAT rate. All shop prices are VAT-inclusive. */
export const VAT_RATE = 0.23;

/** VAT part of a VAT-inclusive amount, rounded to cents. */
export function vatFromGross(gross: number): number {
  return Math.round((gross - gross / (1 + VAT_RATE)) * 100) / 100;
}

export function formatPrice(amount: number, locale: Locale): string {
  // "narrowSymbol": shows "€1,290.00" (not "EUR 1,290.00").
  return new Intl.NumberFormat(INTL_LOCALE[locale], {
    style: "currency",
    currency: "EUR",
    currencyDisplay: "narrowSymbol",
  }).format(amount);
}
