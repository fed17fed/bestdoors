import type { Request } from "express";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@bestdoors/shared";

/** ?locale=uk wins, then Accept-Language, then English. */
export function requestLocale(req: Request): Locale {
  const fromQuery = req.query.locale;
  if (isLocale(fromQuery)) return fromQuery;
  const header = req.headers["accept-language"]?.toLowerCase() ?? "";
  if (header.startsWith("uk")) return "uk";
  return DEFAULT_LOCALE;
}

/** Pick the translation for `locale`, falling back to English, then the first one. */
export function pickTranslation<T extends { locale: string }>(list: T[], locale: Locale): T | undefined {
  return list.find((t) => t.locale === locale) ?? list.find((t) => t.locale === "en") ?? list[0];
}
