import { getTranslations } from "next-intl/server";
import type { Locale } from "@bestdoors/shared";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api";
import { buildCategoryTree, parentOf } from "@/lib/category-tree";
import type { Category } from "@/lib/types";
import { CategoryTile } from "./CategoryTile";
import { CatalogFilters, type CatalogQuery } from "./CatalogFilters";
import { Pagination } from "./Pagination";
import { ProductCard } from "./ProductCard";

const PER_PAGE = 12;
const TILE_COLOURS = ["#1e4fc2", "#f5f5f2", "#383e42", "#b5803f"];
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
  const parent = category ? parentOf(category, categories) : undefined;
  const tree = buildCategoryTree(categories);
  // Subcategory chips: the children of the current main category (or of the parent, on a subcategory page).
  const mainOfPage = tree.find((n) => n.id === (parent?.id ?? category?.id));
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
        <Link href="/" className="hover:text-ink">Mr.Door</Link>
        {category && (
          <>
            {" / "}
            <Link href="/doors" className="hover:text-ink">{t("allDoors")}</Link>
          </>
        )}
        {parent && (
          <>
            {" / "}
            <Link href={`/doors/${parent.slug}`} className="hover:text-ink">{parent.name}</Link>
          </>
        )}
        {category && (
          <>
            {" / "}
            <span className="text-ink" aria-current="page">{category.name}</span>
          </>
        )}
      </nav>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{category?.name ?? t("allDoors")}</h1>
      {category?.description && <p className="mt-2 max-w-2xl text-muted">{category.description}</p>}

      {/* main page: subcategory tiles. 2 columns on mobile (all tiles visible, no hidden scroll), 4 on desktop. */}
      {category && !parent && mainOfPage && mainOfPage.children.length > 0 && (
        <nav aria-label={t("subcategories", { name: category.name })} className="mt-6">
          <ul className={`grid grid-cols-2 gap-3 sm:gap-4 ${mainOfPage.children.length > 2 ? "lg:grid-cols-4" : "lg:max-w-xl"}`}>
            {mainOfPage.children.map((c, i) => (
              <li key={c.id} className="flex">
                <CategoryTile category={c} colour={TILE_COLOURS[i % TILE_COLOURS.length]} />
              </li>
            ))}
          </ul>
        </nav>
      )}

      {/* all-doors page: main category chips */}
      {!category && (
        <div className="mt-6 flex flex-wrap gap-2">
          <span className="rounded-full border border-brand bg-brand px-4 py-1.5 text-sm text-white" aria-current="page">{t("allDoors")}</span>
          {tree.map((c) => (
            <Link key={c.id} href={`/doors/${c.slug}`} className="rounded-full border border-line bg-surface px-4 py-1.5 text-sm hover:border-ink/30">
              {c.name}
            </Link>
          ))}
        </div>
      )}

      {/* subcategory page: way back + sibling chips */}
      {category && parent && mainOfPage && (
        <div className="mt-6">
          <Link href={`/doors/${parent.slug}`} className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
            ← {t("backToAll", { name: parent.name })}
          </Link>
          <div className="mt-3 flex flex-wrap gap-2" aria-label={mainOfPage.name}>
            {mainOfPage.children.map((c) => (
              <Link key={c.id} href={`/doors/${c.slug}`} aria-current={category.id === c.id ? "page" : undefined} className={`rounded-full border px-3.5 py-1 text-sm ${category.id === c.id ? "border-brand bg-brand/10 font-semibold text-brand" : "border-line bg-surface hover:border-ink/30"}`}>
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      )}

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
