import type { MetadataRoute } from "next";
import { LOCALES, type Locale } from "@bestdoors/shared";
import { api } from "@/lib/api";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const HREFLANG: Record<Locale, string> = { en: "en-IE" };

// New doors appear without a new deploy. The catalog API data is cached for 60 s,
// so the sitemap is refreshed at most about once a minute.

/** One entry per page and language, with hreflang links to the other language. */
function entry(path: string, priority: number, changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]) {
  return LOCALES.map((locale) => ({
    url: `${SITE}/${locale}${path}`,
    changeFrequency,
    priority,
    alternates: { languages: Object.fromEntries(LOCALES.map((l) => [HREFLANG[l], `${SITE}/${l}${path}`])) },
  }));
}

async function allProducts() {
  const out: { slug: string; categorySlug: string }[] = [];
  for (let page = 1; page <= 50; page++) {
    const list = await api.products("en", { page, perPage: 60 });
    out.push(...list.data.map((p) => ({ slug: p.slug, categorySlug: p.category.slug })));
    if (page * list.perPage >= list.total) break;
  }
  return out;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products, pages] = await Promise.all([api.categories("en"), allProducts(), api.pages().catch(() => [])]);
  return [
    ...entry("", 1, "weekly"),
    ...entry("/doors", 0.9, "weekly"),
    ...categories.flatMap((c) => entry(`/doors/${c.slug}`, 0.8, "weekly")),
    ...products.flatMap((p) => entry(`/doors/${p.categorySlug}/${p.slug}`, 0.7, "monthly")),
    ...entry("/quote", 0.6, "yearly"),
    // Published info pages from the database (drafts are not listed by the API).
    ...pages.flatMap((p) => entry(`/${p.slug}`, 0.3, "yearly")),
  ];
}
