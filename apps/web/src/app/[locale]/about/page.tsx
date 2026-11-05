import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@bestdoors/shared";
import { infoPage } from "@/content";
import { alternates } from "@/lib/seo";
import { InfoPageView } from "@/components/InfoPageView";

export async function generateMetadata({ params }: PageProps<"/[locale]/about">): Promise<Metadata> {
  const { locale } = await params;
  const c = infoPage("about", locale as Locale);
  return { title: c.title, description: c.description, alternates: alternates(locale as Locale, "/about") };
}

export default async function Page({ params }: PageProps<"/[locale]/about">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <InfoPageView page="about" locale={locale as Locale} />;
}
