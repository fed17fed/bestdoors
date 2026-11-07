import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@bestdoors/shared";
import { loadPage, pageMetadata } from "@/lib/page-route";
import { PageView } from "@/components/PageView";

// The text comes from the database (admin panel → Pages). This file only keeps the old address working.
export async function generateMetadata({ params }: PageProps<"/[locale]/about">): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale as Locale, "about");
}

export default async function Page({ params }: PageProps<"/[locale]/about">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const page = await loadPage("about");
  if (!page) notFound();
  return <PageView page={page} locale={locale as Locale} />;
}
