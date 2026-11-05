import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@bestdoors/shared";
import { api } from "@/lib/api";
import { alternates } from "@/lib/seo";
import { CatalogView, readCatalogQuery } from "@/components/CatalogView";

export async function generateMetadata({ params }: PageProps<"/[locale]/doors/[category]">): Promise<Metadata> {
  const { locale, category: slug } = await params;
  const category = (await api.categories(locale as Locale)).find((c) => c.slug === slug);
  if (!category) return {};
  return {
    title: category.name,
    description: category.description,
    alternates: alternates(locale as Locale, `/doors/${slug}`),
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps<"/[locale]/doors/[category]">) {
  const { locale: l, category: slug } = await params;
  const locale = l as Locale;
  setRequestLocale(locale);
  const categories = await api.categories(locale);
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();
  return (
    <CatalogView locale={locale} category={category} categories={categories} query={readCatalogQuery(await searchParams)} />
  );
}
