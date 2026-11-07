import type { Locale } from "@bestdoors/shared";
import { COMPANY } from "@/lib/company";
import { pagesEn } from "./pages.en";
import type { InfoPage, PageContent } from "./types";

export { INFO_PAGES, type InfoPage } from "./types";

const ALL = { en: pagesEn } satisfies Record<Locale, unknown>;

/** Page texts in the given language, filled with the company facts from company.ts. */
export function infoPage(page: InfoPage, locale: Locale): PageContent {
  return ALL[locale][page](COMPANY);
}
