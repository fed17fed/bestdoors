import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@bestdoors/shared";
import { infoPage } from "@/content";
import { alternates } from "@/lib/seo";
import { InfoPageView } from "@/components/InfoPageView";

export async function generateMetadata({ params }: PageProps<"/[locale]/privacy">): Promise<Metadata> {
  const { locale } = await params;
  const c = infoPage("privacy", locale as Locale);
  return { title: c.title, description: c.description, alternates: alternates(locale as Locale, "/privacy") };
}

export default async function Page({ params }: PageProps<"/[locale]/privacy">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <InfoPageView page="privacy" locale={locale as Locale} />;
}
