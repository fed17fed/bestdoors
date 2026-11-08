import { getTranslations } from "next-intl/server";
import type { Locale } from "@bestdoors/shared";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api";
import { buildCategoryTree } from "@/lib/category-tree";
import { CartLink } from "./CartLink";
import { Logo } from "./Logo";

export async function Header({ locale }: { locale: Locale }) {
  const t = await getTranslations("Nav");
  const tree = buildCategoryTree(await api.categories(locale).catch(() => []));

  return (
    <header className="sticky top-0 z-30 header-bar border-b border-line bg-white/85 backdrop-blur">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:rounded focus:bg-surface focus:px-3 focus:py-2"
      >
        {t("skip")}
      </a>
      <div className="container-page flex h-[4.5rem] items-center gap-6">
        <Link href="/" aria-label="Mr.Door" className="header-logo shrink-0">
          <Logo />
        </Link>

        <nav
          aria-label={t("doors")}
          className="hidden flex-1 items-center gap-5 text-sm font-medium lg:flex"
        >
          {tree.map((c) => (
            <div key={c.id} className="group relative">
              <Link
                href={`/doors/${c.slug}`}
                className="text-muted transition-colors hover:text-brand group-focus-within:text-brand"
              >
                {c.name}
                {c.children.length > 0 && (
                  <span aria-hidden="true" className="ml-1 text-xs">
                    ▾
                  </span>
                )}
              </Link>
              {c.children.length > 0 && (
                <div className="invisible absolute left-0 top-full z-40 w-56 pt-2 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                  <ul className="rounded-xl border border-line bg-surface p-2 shadow-lg">
                    {c.children.map((sub) => (
                      <li key={sub.id}>
                        <Link
                          href={`/doors/${sub.slug}`}
                          className="block rounded-lg px-3 py-2 text-sm text-muted hover:bg-canvas hover:text-brand"
                        >
                          {sub.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
          <Link href="/doors" className="text-muted transition-colors hover:text-brand">
            {t("allDoors")}
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <Link
            href="/quote"
            className="hidden text-sm font-semibold text-brand underline-offset-4 hover:underline sm:inline"
          >
            {t("quote")}
          </Link>
          <CartLink />
          {/* Mobile menu without JavaScript */}
          <details className="relative lg:hidden">
            <summary className="btn-outline cursor-pointer list-none px-3 py-1.5 [&::-webkit-details-marker]:hidden">
              {t("menu")}
            </summary>
            <nav
              aria-label={t("doors")}
              className="absolute right-0 mt-2 flex max-h-[80vh] w-64 flex-col overflow-y-auto rounded-xl border border-line bg-surface p-2 shadow-lg"
            >
              {tree.map((c) => (
                <div key={c.id} className="mb-1">
                  <Link
                    href={`/doors/${c.slug}`}
                    className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-canvas"
                  >
                    {c.name}
                  </Link>
                  {c.children.map((sub) => (
                    <Link
                      key={sub.id}
                      href={`/doors/${sub.slug}`}
                      className="block rounded-lg py-1.5 pl-7 pr-3 text-sm text-muted hover:bg-canvas"
                    >
                      {sub.name}
                    </Link>
                  ))}
                </div>
              ))}
              <Link href="/doors" className="rounded-lg px-3 py-2 text-sm hover:bg-canvas">
                {t("allDoors")}
              </Link>
              <Link
                href="/quote"
                className="rounded-lg px-3 py-2 text-sm font-semibold text-brand hover:bg-canvas"
              >
                {t("quote")}
              </Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
