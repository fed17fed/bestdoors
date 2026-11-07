import { getTranslations } from "next-intl/server";
import type { Locale } from "@bestdoors/shared";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api";
import { CartLink } from "./CartLink";
import { Logo } from "./Logo";

export async function Header({ locale }: { locale: Locale }) {
  const t = await getTranslations("Nav");
  const categories = await api.categories(locale).catch(() => []);

  return (
    <header className="sticky top-0 z-30 header-bar border-b border-line bg-white/85 backdrop-blur">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:rounded focus:bg-surface focus:px-3 focus:py-2">
        {t("skip")}
      </a>
      <div className="container-page flex h-[4.5rem] items-center gap-6">
        <Link href="/" aria-label="Mr.Door" className="header-logo shrink-0">
          <Logo />
        </Link>

        <nav aria-label={t("doors")} className="hidden flex-1 items-center gap-5 text-sm font-medium lg:flex">
          {categories.map((c) => (
            <Link key={c.id} href={`/doors/${c.slug}`} className="text-muted transition-colors hover:text-brand">
              {c.name}
            </Link>
          ))}
          <Link href="/doors" className="text-muted transition-colors hover:text-brand">
            {t("allDoors")}
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <Link href="/quote" className="hidden text-sm font-semibold text-brand underline-offset-4 hover:underline sm:inline">
            {t("quote")}
          </Link>
          <CartLink />
          {/* Mobile menu without JavaScript */}
          <details className="relative lg:hidden">
            <summary className="btn-outline cursor-pointer list-none px-3 py-1.5 [&::-webkit-details-marker]:hidden">{t("menu")}</summary>
            <nav aria-label={t("doors")} className="absolute right-0 mt-2 flex w-60 flex-col rounded-xl border border-line bg-surface p-2 shadow-lg">
              {categories.map((c) => (
                <Link key={c.id} href={`/doors/${c.slug}`} className="rounded-lg px-3 py-2 text-sm hover:bg-canvas">
                  {c.name}
                </Link>
              ))}
              <Link href="/doors" className="rounded-lg px-3 py-2 text-sm hover:bg-canvas">{t("allDoors")}</Link>
              <Link href="/quote" className="rounded-lg px-3 py-2 text-sm font-semibold text-brand hover:bg-canvas">{t("quote")}</Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
