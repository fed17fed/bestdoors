import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@bestdoors/shared";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api";
import { DoorIllustration } from "@/components/DoorIllustration";
import { ProductCard } from "@/components/ProductCard";
import { defaultGlass, isDoubleDoor } from "@/lib/door-look";

const CATEGORY_COLOURS = ["#1f4d3a", "#f5f5f2", "#383e42", "#b5803f", "#d2a76b"];

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale: l } = await params;
  const locale = l as Locale;
  setRequestLocale(locale);
  const t = await getTranslations("Home");
  const [categories, featured] = await Promise.all([
    api.categories(locale),
    api.products(locale, { perPage: 60 }).then((r) => r.data.filter((p) => p.featured).slice(0, 8)),
  ]);

  const why = ["ireland", "weather", "config", "delivery"] as const;

  return (
    <>
      {/* Hero */}
      <section className="overflow-hidden bg-gradient-to-br from-brand-soft via-canvas to-oak-soft">
        <div className="container-page grid items-center gap-10 py-16 md:grid-cols-2 md:py-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand shadow-sm">
              <span aria-hidden className="h-2 w-2 rounded-full bg-brand" /> {t("eyebrow")}
            </p>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">{t("heroTitle")}</h1>
            <p className="mt-5 max-w-xl text-lg text-muted">{t("heroText")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/doors" className="btn-primary px-7 py-3 text-base">{t("shopNow")}</Link>
              <Link href="/quote" className="btn-outline px-7 py-3 text-base">{t("getQuote")}</Link>
            </div>
          </div>
          <div className="relative flex justify-center gap-6" aria-hidden>
            <DoorIllustration className="h-72 w-auto drop-shadow-xl sm:h-96" colour="#1f4d3a" glass="frosted" handle="brass" />
            <DoorIllustration className="mt-12 hidden h-72 w-auto drop-shadow-xl sm:block sm:h-96" colour="#383e42" glass="clear" handle="black-bar" double />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container-page py-16" aria-labelledby="cat-title">
        <h2 id="cat-title" className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t("categoriesTitle")}</h2>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((c, i) => (
            <Link key={c.id} href={`/doors/${c.slug}`} className="group rounded-2xl border border-line bg-surface p-4 transition-shadow hover:shadow-lg">
              <div className="flex aspect-square items-center justify-center rounded-xl bg-canvas">
                <DoorIllustration className="h-4/5 w-auto transition-transform group-hover:scale-105" colour={CATEGORY_COLOURS[i % CATEGORY_COLOURS.length]} glass={defaultGlass(c.type)} double={isDoubleDoor(c.type)} />
              </div>
              <h3 className="mt-3 font-bold">{c.name}</h3>
              <p className="text-sm text-muted">{t("doorsCount", { count: c.productCount })}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="container-page py-8" aria-labelledby="feat-title">
        <div className="flex items-end justify-between gap-4">
          <h2 id="feat-title" className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t("featuredTitle")}</h2>
          <Link href="/doors" className="text-sm font-semibold text-brand hover:underline">{t("viewAll")} →</Link>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((p) => <ProductCard key={p.id} product={p} locale={locale} />)}
        </div>
      </section>

      {/* Why */}
      <section className="container-page py-16" aria-labelledby="why-title">
        <h2 id="why-title" className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t("whyTitle")}</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {why.map((k, i) => (
            <div key={k} className="rounded-2xl bg-surface p-6 ring-1 ring-line">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-sm font-extrabold text-brand">{i + 1}</span>
              <h3 className="mt-4 font-bold">{t(`why.${k}Title`)}</h3>
              <p className="mt-1 text-sm text-muted">{t(`why.${k}Text`)}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
