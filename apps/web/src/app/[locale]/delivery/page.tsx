import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@bestdoors/shared";
import { loadPage, pageMetadata } from "@/lib/page-route";
import { PageView } from "@/components/PageView";

// The text comes from the database (admin panel → Pages). This file only keeps the old address working.
export async function generateMetadata({ params }: PageProps<"/[locale]/delivery">): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale as Locale, "delivery");
}

export default async function Page({ params }: PageProps<"/[locale]/delivery">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const page = await loadPage("delivery");
  if (!page) notFound();
  return <PageView page={page} locale={locale as Locale} />;
}
