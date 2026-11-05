import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SortSelect } from "./SortSelect";

export type CatalogQuery = {
  q?: string;
  material?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
  page?: string;
};

/** A plain GET form: filters work even without JavaScript and stay in the URL. */
export async function CatalogFilters({
  basePath,
  query,
  materials,
}: {
  basePath: string;
  query: CatalogQuery;
  materials: string[];
}) {
  const t = await getTranslations("Catalog");
  return (
    <form method="get" className="space-y-5 rounded-2xl border border-line bg-surface p-5" aria-label={t("filters")}>
      <h2 className="text-sm font-bold">{t("filters")}</h2>
      <div>
        <label htmlFor="f-q" className="label">{t("search")}</label>
        <input id="f-q" name="q" type="search" defaultValue={query.q} placeholder={t("searchPlaceholder")} className="input" />
      </div>
      <div>
        <label htmlFor="f-material" className="label">{t("material")}</label>
        <select id="f-material" name="material" defaultValue={query.material ?? ""} className="input">
          <option value="">{t("anyMaterial")}</option>
          {materials.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>
      <fieldset>
        <legend className="label">{t("price")}</legend>
        <div className="flex gap-2">
          <input aria-label={t("min")} name="minPrice" type="number" min={0} step={10} inputMode="numeric" defaultValue={query.minPrice} placeholder={t("min")} className="input" />
          <input aria-label={t("max")} name="maxPrice" type="number" min={0} step={10} inputMode="numeric" defaultValue={query.maxPrice} placeholder={t("max")} className="input" />
        </div>
      </fieldset>
      <SortSelect defaultValue={query.sort ?? "newest"} labels={{
        sort: t("sort"),
        newest: t("sortNewest"),
        "price-asc": t("sortPriceAsc"),
        "price-desc": t("sortPriceDesc"),
        name: t("sortName"),
      }} />
      <div className="flex gap-2">
        <button type="submit" className="btn-primary flex-1">{t("apply")}</button>
        <Link href={basePath} className="btn-outline">{t("reset")}</Link>
      </div>
    </form>
  );
}
