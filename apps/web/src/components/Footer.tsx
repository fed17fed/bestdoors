import { getTranslations } from "next-intl/server";
import type { Locale } from "@bestdoors/shared";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api";
import { buildCategoryTree } from "@/lib/category-tree";
import { COMPANY, isPlaceholder } from "@/lib/company";
import { Logo } from "./Logo";

export async function Footer({ locale }: { locale: Locale }) {
  const t = await getTranslations("Footer");
  const nav = await getTranslations("Nav");
  const tree = buildCategoryTree(await api.categories(locale).catch(() => []));
  // Footer links come from the database (admin panel → Pages): published pages with "Show in footer".
  const pages = (await api.pages().catch(() => [])).filter((p) => p.showInFooter);

  return (
    <footer className="mt-24 bg-brand-dark text-white/80">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Logo inverted />
          <p className="mt-3 max-w-sm text-sm">{t("tagline")}</p>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-bold text-white">{t("shop")}</h2>
          <ul className="space-y-2 text-sm">
            {tree.map((c) => (
              <li key={c.id}>
                <Link href={`/doors/${c.slug}`} className="font-semibold text-white hover:underline">{c.name}</Link>
                {c.children.length > 0 && (
                  <ul className="mt-1 space-y-1 pl-3">
                    {c.children.map((sub) => (
                      <li key={sub.id}><Link href={`/doors/${sub.slug}`} className="hover:text-white">{sub.name}</Link></li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-bold text-white">{t("help")}</h2>
          <ul className="space-y-2 text-sm">
            <li><Link href="/quote" className="hover:text-white">{nav("quote")}</Link></li>
            {pages.map((p) => (
              <li key={p.slug}>
                <Link href={`/${p.slug}`} className="hover:text-white">{p.title}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-1 py-5 text-xs sm:flex-row sm:justify-between">
          <p>{t("rights", { year: new Date().getFullYear() })}</p>
          {/* Company identity is shown once it is filled in (lib/company.ts). */}
          {!isPlaceholder(COMPANY.legalName) && (
            <p>
              {[COMPANY.legalName, !isPlaceholder(COMPANY.croNumber) && `CRO ${COMPANY.croNumber}`, !isPlaceholder(COMPANY.vatNumber) && `VAT ${COMPANY.vatNumber}`]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
        </div>
      </div>
    </footer>
  );
}
