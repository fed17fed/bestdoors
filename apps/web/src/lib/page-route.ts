import "server-only";
import type { Metadata } from "next";
import { ApiError, api } from "./api";
import { alternates } from "./seo";
import type { Locale } from "@bestdoors/shared";
import type { InfoPage } from "./types";

/** The published page, or null when it is missing or a draft. Other API errors are thrown. */
export async function loadPage(slug: string): Promise<InfoPage | null> {
  try {
    return await api.page(slug);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

/** SEO tags for a CMS page: SEO title/description from the admin panel, with the page title as fallback. */
export async function pageMetadata(locale: Locale, slug: string): Promise<Metadata> {
  const page = await loadPage(slug);
  if (!page) return { title: "Not found", robots: { index: false } };
  const title = page.seoTitle || page.title;
  return {
    title,
    description: page.seoDescription || undefined,
    alternates: alternates(locale, `/${slug}`),
    openGraph: { title, description: page.seoDescription || undefined, type: "article", url: `/${locale}/${slug}` },
  };
}
