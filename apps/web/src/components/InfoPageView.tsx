import { getTranslations } from "next-intl/server";
import { INTL_LOCALE, type Locale } from "@bestdoors/shared";
import { Link } from "@/i18n/navigation";
import { infoPage, type InfoPage } from "@/content";
import { COMPANY } from "@/lib/company";

const PLACEHOLDER = /(\[TO FILL:[^\]]*\])/g;

/** Text with "[TO FILL: …]" parts highlighted, so missing facts are easy to see. */
function Text({ value }: { value: string }) {
  return (
    <>
      {value.split(PLACEHOLDER).map((part, i) =>
        part.startsWith("[TO FILL:") ? (
          <mark key={i} className="rounded bg-oak-soft px-1 text-ink">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

export async function InfoPageView({ page, locale }: { page: InfoPage; locale: Locale }) {
  const t = await getTranslations("Info");
  const content = infoPage(page, locale);
  const hasPlaceholders = JSON.stringify(content).includes("[TO FILL:");
  const updated = new Intl.DateTimeFormat(INTL_LOCALE[locale], { dateStyle: "long" }).format(new Date(COMPANY.legalUpdated));

  return (
    <div className="container-page py-10 sm:py-14">
      <article className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{content.title}</h1>
        {content.intro && <p className="mt-3 text-lg text-muted">{content.intro}</p>}
        {content.legal && <p className="mt-3 text-sm text-muted">{t("updated", { date: updated })}</p>}

        {((content.legal && !COMPANY.legalReviewed) || hasPlaceholders) && (
          <div role="note" className="mt-6 space-y-1 rounded-xl border border-oak/40 bg-oak-soft px-4 py-3 text-sm">
            {content.legal && !COMPANY.legalReviewed && <p className="font-semibold">{t("draftLegal")}</p>}
            {hasPlaceholders && <p>{t("missingFacts")}</p>}
          </div>
        )}

        {content.sections.length > 4 && (
          <nav aria-label={t("contents")} className="mt-8 rounded-2xl border border-line bg-surface p-5">
            <p className="text-sm font-bold">{t("contents")}</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
              {content.sections.map((s, i) => (
                <li key={i}><a href={`#${s.id ?? `s${i + 1}`}`} className="text-brand hover:underline">{s.heading}</a></li>
              ))}
            </ol>
          </nav>
        )}

        <div className="mt-8 space-y-10">
          {content.sections.map((s, i) => (
            <section key={i} id={s.id ?? `s${i + 1}`} className="scroll-mt-24">
              <h2 className="text-xl font-bold">{s.heading}</h2>
              {s.paragraphs?.map((p, j) => (
                <p key={j} className="mt-3 leading-relaxed text-ink/90"><Text value={p} /></p>
              ))}
              {s.list && (
                <ul className="mt-3 list-disc space-y-1.5 pl-5 leading-relaxed text-ink/90">
                  {s.list.map((item, j) => <li key={j}><Text value={item} /></li>)}
                </ul>
              )}
              {s.table && (
                <div className="mt-4 overflow-x-auto rounded-xl border border-line">
                  <table className="w-full min-w-[520px] text-left text-sm">
                    <thead className="bg-canvas">
                      <tr>{s.table[0].map((h, j) => <th key={j} scope="col" className="px-3 py-2 font-semibold">{h}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-line bg-surface">
                      {s.table.slice(1).map((row, j) => (
                        <tr key={j}>{row.map((cell, k) => <td key={k} className="px-3 py-2 align-top"><Text value={cell} /></td>)}</tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ))}
        </div>

        {(page === "contact" || page === "about") && (
          <div className="mt-12 flex flex-wrap gap-3">
            <Link href="/quote" className="btn-primary">{t("toQuote")}</Link>
            <Link href="/doors" className="btn-outline">{t("toDoors")}</Link>
          </div>
        )}
      </article>
    </div>
  );
}
