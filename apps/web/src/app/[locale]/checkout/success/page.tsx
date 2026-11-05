import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CheckoutResult } from "@/components/CheckoutResult";

export async function generateMetadata({ params }: PageProps<"/[locale]/checkout/success">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Checkout" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function CheckoutSuccessPage({ params, searchParams }: PageProps<"/[locale]/checkout/success">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sessionId = (await searchParams).session_id;
  return (
    <div className="container-page py-12 sm:py-16">
      <CheckoutResult sessionId={typeof sessionId === "string" ? sessionId : ""} />
    </div>
  );
}
