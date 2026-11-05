import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@bestdoors/shared";
import { routing } from "@/i18n/routing";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CookieNotice } from "@/components/CookieNotice";
import { alternates } from "@/lib/seo";
import "../globals.css";

const manrope = Manrope({ subsets: ["latin", "cyrillic"], variable: "--font-manrope", display: "swap" });

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Meta" });
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
    title: { default: t("title"), template: "%s | BestDoors" },
    description: t("description"),
    alternates: alternates(locale as Locale, ""),
    openGraph: { siteName: "BestDoors", locale: locale === "uk" ? "uk_UA" : "en_IE", type: "website" },
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={locale} className={manrope.variable}>
      <body className="flex min-h-screen flex-col font-sans">
        <NextIntlClientProvider>
          <Header locale={locale} />
          <main id="main" className="flex-1">{children}</main>
          <Footer locale={locale} />
          <CookieNotice />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
