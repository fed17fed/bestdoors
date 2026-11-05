import type { Company } from "@/lib/company";

export const INFO_PAGES = ["about", "contact", "delivery", "returns", "privacy", "terms"] as const;
export type InfoPage = (typeof INFO_PAGES)[number];

export type Section = {
  id?: string;
  heading: string;
  paragraphs?: string[];
  list?: string[];
  /** Simple table: first row = header. */
  table?: string[][];
};

export type PageContent = {
  title: string;
  description: string;
  /** Legal text: shows "last updated" and the "needs a legal check" note. */
  legal: boolean;
  intro?: string;
  sections: Section[];
};

export type PageTexts = Record<InfoPage, (c: Company) => PageContent>;
