import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@bestdoors/shared";
import { Link } from "@/i18n/navigation";
import { api, ApiError } from "@/lib/api";
import { alternates } from "@/lib/seo";
import { Configurator } from "@/components/Configurator";

type Props = PageProps<"/[locale]/doors/[category]/[slug]">;

async function load(locale: Locale, slug: string) {
  try {
    return await api.product(locale, slug);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, category, slug } = await params;
  const product = await load(locale as Locale, slug);
  return {
    title: product.name,
    description: product.description,
    alternates: alternates(locale as Locale, `/doors/${category}/${slug}`),
    openGraph: { title: product.name, description: product.description, images: product.images.map((i) => i.url) },
  };
}

export default async function ProductPage({ params }: Props) {
  const { locale: l, category, slug } = await params;
  const locale = l as Locale;
  setRequestLocale(locale);
  const product = await load(locale, slug);
  // Keep one canonical URL per product.
  if (product.category.slug !== category) redirect(`/${locale}/doors/${product.category.slug}/${slug}`);
  const t = await getTranslations("Product");

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    material: product.material,
    brand: { "@type": "Brand", name: "Mr.Door" },
    image: product.images.map((i) => i.url),
    offers: {
      "@type": "Offer",
      priceCurrency: "EUR",
      price: product.price.toFixed(2),
      availability: "https://schema.org/InStock",
      url: `${site}/${locale}/doors/${category}/${slug}`,
    },
  };

  return (
    <div className="container-page py-10">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted">
        <Link href="/" className="hover:text-ink">{t("breadcrumbHome")}</Link>
        {product.category.parent && (
          <>
            {" / "}
            <Link href={`/doors/${product.category.parent.slug}`} className="hover:text-ink">{product.category.parent.name}</Link>
          </>
        )}
        {" / "}
        <Link href={`/doors/${product.category.slug}`} className="hover:text-ink">{product.category.name}</Link>
        {" / "}
        <span className="text-ink">{product.name}</span>
      </nav>
      <Configurator product={product} />
      <script
        type="application/ld+json"
        // JSON.stringify output with "<" escaped is safe to inline.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </div>
  );
}
