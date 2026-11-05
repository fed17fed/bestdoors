export const LOCALES = ["en", "uk"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** Intl locale used for number/date formatting. */
export const INTL_LOCALE: Record<Locale, string> = { en: "en-IE", uk: "uk-UA" };
