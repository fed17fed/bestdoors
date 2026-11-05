import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@bestdoors/shared";
import { api } from "@/lib/api";
import { alternates } from "@/lib/seo";
import { CatalogView, readCatalogQuery } from "@/components/CatalogView";

export async function generateMetadata({ params }: PageProps<"/[locale]/doors">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Catalog" });
  return { title: t("allDoors"), alternates: alternates(locale as Locale, "/doors") };
}

export default async function DoorsPage({ params, searchParams }: PageProps<"/[locale]/doors">) {
  const { locale: l } = await params;
  const locale = l as Locale;
  setRequestLocale(locale);
  const categories = await api.categories(locale);
  return <CatalogView locale={locale} categories={categories} query={readCatalogQuery(await searchParams)} />;
}
