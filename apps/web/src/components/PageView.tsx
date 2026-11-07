import { getTranslations } from "next-intl/server";
import { INTL_LOCALE, type Locale } from "@bestdoors/shared";
import { Link } from "@/i18n/navigation";
import { COMPANY } from "@/lib/company";
import { addHeadingIds, hasPlaceholders, markPlaceholders } from "@/lib/page-html";
import type { InfoPage } from "@/lib/types";

/** Pages with legal text: they show "last updated" and the "needs a legal check" note. */
const LEGAL = ["privacy", "terms", "returns"];
/** Pages that end with buttons to the quote form and the catalog. */
const WITH_BUTTONS = ["contact", "about"];

/**
 * A CMS page. The HTML comes from the API, which already removed scripts, iframes and on* attributes
 * (apps/api/src/lib/sanitize-html.ts), so it is safe to put into the page.
 */
export async function PageView({ page, locale }: { page: InfoPage; locale: Locale }) {
  const t = await getTranslations("Info");
  const legal = LEGAL.includes(page.slug);
  const missing = hasPlaceholders(page.content);
  const { html, headings } = addHeadingIds(markPlaceholders(page.content));
  const updated = new Intl.DateTimeFormat(INTL_LOCALE[locale], { dateStyle: "long" }).format(new Date(page.updatedAt));

  return (
    <div className="container-page py-10 sm:py-14">
      <article className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{page.title}</h1>
        {legal && <p className="mt-3 text-sm text-muted">{t("updated", { date: updated })}</p>}

        {((legal && !COMPANY.legalReviewed) || missing) && (
          <div role="note" className="mt-6 space-y-1 rounded-xl border border-oak/40 bg-oak-soft px-4 py-3 text-sm">
            {legal && !COMPANY.legalReviewed && <p className="font-semibold">{t("draftLegal")}</p>}
            {missing && <p>{t("missingFacts")}</p>}
          </div>
        )}

        {headings.length > 4 && (
          <nav aria-label={t("contents")} className="mt-8 rounded-2xl border border-line bg-surface p-5">
            <p className="text-sm font-bold">{t("contents")}</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
              {headings.map((h) => (
                <li key={h.id}><a href={`#${h.id}`} className="text-brand hover:underline">{h.text}</a></li>
              ))}
            </ol>
          </nav>
        )}

        <div className="page-content mt-8" dangerouslySetInnerHTML={{ __html: html }} />

        {WITH_BUTTONS.includes(page.slug) && (
          <div className="mt-12 flex flex-wrap gap-3">
            <Link href="/quote" className="btn-primary">{t("toQuote")}</Link>
            <Link href="/doors" className="btn-outline">{t("toDoors")}</Link>
          </div>
        )}
      </article>
    </div>
  );
}
