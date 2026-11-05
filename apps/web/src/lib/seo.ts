import { LOCALES, type Locale } from "@bestdoors/shared";

/** canonical + hreflang links for a path without the locale prefix (e.g. "/doors"). */
export function alternates(locale: Locale, path: string) {
  return {
    canonical: `/${locale}${path}`,
    languages: {
      ...Object.fromEntries(LOCALES.map((l) => [l === "uk" ? "uk-UA" : "en-IE", `/${l}${path}`])),
      "x-default": `/en${path}`,
    },
  };
}
