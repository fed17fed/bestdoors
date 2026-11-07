/**
 * Small helpers for the HTML of CMS pages. The API has already cleaned the HTML
 * (no script, iframe or on* attributes), so here we only add anchors and highlight missing facts.
 */
export type Heading = { id: string; text: string };

const stripTags = (s: string) => s.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");

export function slugify(text: string): string {
  return stripTags(text)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Adds an id to every <h2> (so "#cookies" links work) and returns the list of headings. */
export function addHeadingIds(html: string): { html: string; headings: Heading[] } {
  const headings: Heading[] = [];
  const used = new Set<string>();
  const out = html.replace(/<h2>([\s\S]*?)<\/h2>/g, (_m, inner: string) => {
    const text = stripTags(inner).trim();
    const base = slugify(text) || `section-${headings.length + 1}`;
    let id = base;
    for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
    used.add(id);
    headings.push({ id, text });
    return `<h2 id="${id}">${inner}</h2>`;
  });
  return { html: out, headings };
}

const PLACEHOLDER = /\[TO FILL:[^\]<>]*\]/g;

/** True if the text still has "[TO FILL: …]" parts. */
export const hasPlaceholders = (html: string) => new RegExp(PLACEHOLDER.source).test(html);

/** Wraps "[TO FILL: …]" in <mark>, so missing facts are easy to see. */
export const markPlaceholders = (html: string) => html.replace(PLACEHOLDER, (m) => `<mark>${m}</mark>`);
