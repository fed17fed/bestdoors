import { getTranslations } from "next-intl/server";
import type { Locale } from "@bestdoors/shared";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api";
import type { Category } from "@/lib/types";
import { CatalogFilters, type CatalogQuery } from "./CatalogFilters";
import { Pagination } from "./Pagination";
import { ProductCard } from "./ProductCard";

const PER_PAGE = 12;
const SORTS = ["newest", "price-asc", "price-desc", "name"];

/** Turns raw URL search params into a clean, safe query. */
export function readCatalogQuery(sp: Record<string, string | string[] | undefined>): CatalogQuery {
  const one = (k: string) => {
    const v = sp[k];
    const s = (Array.isArray(v) ? v[0] : v)?.trim();
    return s ? s.slice(0, 100) : undefined;
  };
  const num = (k: string) => {
    const v = one(k);
    return v && /^\d+(\.\d+)?$/.test(v) ? v : undefined;
  };
  const sort = one("sort");
  const page = one("page");
  return {
    q: one("q"),
    material: one("material"),
    minPrice: num("minPrice"),
    maxPrice: num("maxPrice"),
    sort: sort && SORTS.includes(sort) ? sort : undefined,
    page: page && /^\d+$/.test(page) ? page : undefined,
  };
}

export async function CatalogView({
  locale,
  category,
  categories,
  query,
}: {
  locale: Locale;
  category?: Category;
  categories: Category[];
  query: CatalogQuery;
}) {
  const t = await getTranslations("Catalog");
  const basePath = category ? `/doors/${category.slug}` : "/doors";
  const page = Math.max(1, Number(query.page ?? 1));
  const list = await api.products(locale, {
    ...query,
    page,
    perPage: PER_PAGE,
    category: category?.slug,
  });
  const pages = Math.max(1, Math.ceil(list.total / PER_PAGE));

  return (
    <div className="container-page py-10">
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link href="/" className="hover:text-ink">BestDoors</Link>
        {category && (
          <>
            {" / "}
            <Link href="/doors" className="hover:text-ink">{t("allDoors")}</Link>
          </>
        )}
      </nav>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{category?.name ?? t("allDoors")}</h1>
      {category?.description && <p className="mt-2 max-w-2xl text-muted">{category.description}</p>}

      {/* category chips */}
      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/doors" className={`rounded-full border px-4 py-1.5 text-sm ${!category ? "border-brand bg-brand text-white" : "border-line bg-surface hover:border-ink/30"}`}>
          {t("allDoors")}
        </Link>
        {categories.map((c) => (
          <Link key={c.id} href={`/doors/${c.slug}`} className={`rounded-full border px-4 py-1.5 text-sm ${category?.id === c.id ? "border-brand bg-brand text-white" : "border-line bg-surface hover:border-ink/30"}`}>
            {c.name}
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside>
          <CatalogFilters basePath={basePath} query={query} materials={list.facets.materials} />
        </aside>
        <section aria-live="polite">
          <p className="mb-4 text-sm text-muted">{t("results", { count: list.total })}</p>
          {list.data.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-line p-10 text-center text-muted">{t("noResults")}</p>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {list.data.map((p) => <ProductCard key={p.id} product={p} locale={locale} />)}
            </div>
          )}
          <Pagination basePath={basePath} query={{ ...query, page: undefined }} page={page} pages={pages} />
        </section>
      </div>
    </div>
  );
}
