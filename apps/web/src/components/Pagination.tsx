import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function Pagination({
  basePath,
  query,
  page,
  pages,
}: {
  basePath: string;
  query: Record<string, string | undefined>;
  page: number;
  pages: number;
}) {
  if (pages <= 1) return null;
  const t = await getTranslations("Catalog");
  const href = (p: number) => ({
    pathname: basePath,
    query: Object.fromEntries(
      Object.entries({ ...query, page: p > 1 ? String(p) : undefined }).filter(([, v]) => v),
    ) as Record<string, string>,
  });
  return (
    <nav aria-label={t("pageOf", { page, pages })} className="mt-10 flex items-center justify-center gap-3 text-sm">
      {page > 1 ? <Link href={href(page - 1)} className="btn-outline">{t("prev")}</Link> : <span aria-disabled="true" className="btn-outline cursor-not-allowed border-dashed text-muted">{t("prev")}</span>}
      <span className="text-muted">{t("pageOf", { page, pages })}</span>
      {page < pages ? <Link href={href(page + 1)} className="btn-outline">{t("next")}</Link> : <span aria-disabled="true" className="btn-outline cursor-not-allowed border-dashed text-muted">{t("next")}</span>}
    </nav>
  );
}
