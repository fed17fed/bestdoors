import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@bestdoors/shared";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api";
import { CategoryTile } from "@/components/CategoryTile";
import { HeroArt } from "@/components/HeroArt";
import { ProductCard } from "@/components/ProductCard";

const MAIN_COLOURS = ["#1e4fc2", "#f5f5f2"];

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale: l } = await params;
  const locale = l as Locale;
  setRequestLocale(locale);
  const t = await getTranslations("Home");
  const [categories, featured] = await Promise.all([
    api.categories(locale),
    api.products(locale, { perPage: 60 }).then((r) => r.data.filter((p) => p.featured).slice(0, 8)),
  ]);

  const mainCategories = categories.filter((c) => !c.parentId);
  const why = ["ireland", "weather", "config", "delivery"] as const;

  return (
    <>
      {/* Hero */}
      <section className="hero-bg overflow-hidden">
        <div className="container-page grid items-center gap-8 py-10 md:py-16 lg:grid-cols-[1fr_1.05fr] lg:gap-12 lg:py-20">
          <div>
            <p className="inline-flex animate-fade-up items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-xs font-bold uppercase tracking-wider text-navy">
              <span aria-hidden className="h-2 w-2 rounded-full bg-accent" /> {t("eyebrow")}
            </p>
            <h1 className="delay-1 mt-5 animate-fade-up text-4xl font-black leading-[1.08] tracking-tight text-navy sm:text-5xl lg:text-6xl">{t("heroTitle")}</h1>
            <p className="delay-2 mt-5 max-w-xl animate-fade-up text-lg text-muted">{t("heroText")}</p>
            <div className="delay-3 mt-8 flex animate-fade-up flex-wrap gap-3">
              <Link href="/doors" className="btn-accent btn-shine px-7 py-3 text-base">{t("shopNow")}</Link>
              <Link href="/quote" className="btn-outline px-7 py-3 text-base">{t("getQuote")}</Link>
            </div>
          </div>
          <HeroArt alt={t("heroAlt")} badge={t("heroBadge")} />
        </div>
      </section>

      {/* Categories */}
      <section className="container-page py-16" aria-labelledby="cat-title">
        <h2 id="cat-title" className="reveal text-2xl font-black tracking-tight sm:text-3xl">{t("categoriesTitle")}</h2>
        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
          {mainCategories.map((c, i) => (
            <CategoryTile key={c.id} category={c} size="large" reveal colour={MAIN_COLOURS[i % MAIN_COLOURS.length]} />
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="container-page py-8" aria-labelledby="feat-title">
        <div className="flex items-end justify-between gap-4">
          <h2 id="feat-title" className="reveal text-2xl font-black tracking-tight sm:text-3xl">{t("featuredTitle")}</h2>
          <Link href="/doors" className="text-sm font-semibold text-brand hover:underline">{t("viewAll")} →</Link>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((p) => <div key={p.id} className="reveal"><ProductCard product={p} locale={locale} /></div>)}
        </div>
      </section>

      {/* Why */}
      <section className="container-page py-16" aria-labelledby="why-title">
        <h2 id="why-title" className="reveal text-2xl font-black tracking-tight sm:text-3xl">{t("whyTitle")}</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {why.map((k, i) => (
            <div key={k} className="reveal lift rounded-2xl bg-surface p-6 ring-1 ring-line">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-sm font-extrabold text-brand transition-transform group-hover:rotate-12">{i + 1}</span>
              <h3 className="mt-4 font-bold">{t(`why.${k}Title`)}</h3>
              <p className="mt-1 text-sm text-muted">{t(`why.${k}Text`)}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
