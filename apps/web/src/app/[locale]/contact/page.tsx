import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@bestdoors/shared";
import { infoPage } from "@/content";
import { alternates } from "@/lib/seo";
import { InfoPageView } from "@/components/InfoPageView";

export async function generateMetadata({ params }: PageProps<"/[locale]/contact">): Promise<Metadata> {
  const { locale } = await params;
  const c = infoPage("contact", locale as Locale);
  return { title: c.title, description: c.description, alternates: alternates(locale as Locale, "/contact") };
}

export default async function Page({ params }: PageProps<"/[locale]/contact">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <InfoPageView page="contact" locale={locale as Locale} />;
}
