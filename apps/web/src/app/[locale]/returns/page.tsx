import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@bestdoors/shared";
import { loadPage, pageMetadata } from "@/lib/page-route";
import { PageView } from "@/components/PageView";

// The text comes from the database (admin panel → Pages). This file only keeps the old address working.
export async function generateMetadata({ params }: PageProps<"/[locale]/returns">): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale as Locale, "returns");
}

export default async function Page({ params }: PageProps<"/[locale]/returns">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const page = await loadPage("returns");
  if (!page) notFound();
  return <PageView page={page} locale={locale as Locale} />;
}
