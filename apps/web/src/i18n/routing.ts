import { defineRouting } from "next-intl/routing";
import { DEFAULT_LOCALE, LOCALES } from "@bestdoors/shared";

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  // URLs always include the language: /en/doors, /uk/doors
  localePrefix: "always",
});
