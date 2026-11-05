import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@bestdoors/shared";
import { api } from "@/lib/api";
import { alternates } from "@/lib/seo";
import { QuoteForm } from "@/components/QuoteForm";

export async function generateMetadata({ params }: PageProps<"/[locale]/quote">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Quote" });
  return { title: t("title"), description: t("metaDescription"), alternates: alternates(locale as Locale, "/quote") };
}

export default async function QuotePage({ params, searchParams }: PageProps<"/[locale]/quote">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Quote");

  // Coming from a product page: /quote?product=<slug>
  const slug = (await searchParams).product;
  const product =
    typeof slug === "string" && /^[a-z0-9-]{2,180}$/.test(slug)
      ? await api.product(locale as Locale, slug).catch(() => null)
      : null;

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{t("title")}</h1>
        <p className="mt-3 text-lg text-muted">{t("intro")}</p>
        <QuoteForm
          product={product ? { id: product.id, name: product.name, type: product.category.type } : null}
        />
      </div>
    </div>
  );
}
