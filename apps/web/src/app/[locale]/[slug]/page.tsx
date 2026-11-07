import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@bestdoors/shared";
import { api } from "@/lib/api";
import { routing } from "@/i18n/routing";
import { loadPage, pageMetadata } from "@/lib/page-route";
import { PageView } from "@/components/PageView";

// Pages are edited in the admin panel: new ones appear without a deploy (data refreshes every 60 s).
export const dynamicParams = true;

export async function generateStaticParams() {
  const pages = await api.pages().catch(() => []);
  return routing.locales.flatMap((locale) => pages.map((p) => ({ locale, slug: p.slug })));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  return pageMetadata(locale as Locale, slug);
}

export default async function CmsPage({ params }: PageProps<"/[locale]/[slug]">) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const page = await loadPage(slug);
  if (!page) notFound();
  return <PageView page={page} locale={locale as Locale} />;
}
