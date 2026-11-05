import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CartView } from "@/components/CartView";

export async function generateMetadata({ params }: PageProps<"/[locale]/cart">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Cart" });
  // The cart is personal: keep it out of search engines.
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function CartPage({ params, searchParams }: PageProps<"/[locale]/cart">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Cart");
  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{t("title")}</h1>
      <CartView cancelled={(await searchParams).checkout === "cancelled"} />
    </div>
  );
}
