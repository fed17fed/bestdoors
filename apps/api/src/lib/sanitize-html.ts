import sanitizeHtml from "sanitize-html";

/**
 * Cleans rich-text HTML from the admin editor. Only simple formatting is kept.
 * Removed: script, style, iframe, forms, event attributes (onclick…), javascript: links, data: images.
 * Used when a page is saved AND when it is read, so old or hand-inserted data is safe too.
 */
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "h2", "h3", "h4", "p", "br", "hr", "strong", "b", "em", "i", "u", "s", "mark", "code", "pre", "blockquote",
    "ul", "ol", "li", "a", "img", "table", "thead", "tbody", "tr", "th", "td",
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "title", "width", "height", "loading"],
    th: ["colspan", "rowspan"],
    td: ["colspan", "rowspan"],
    p: ["style"],
    h2: ["style"],
    h3: ["style"],
    h4: ["style"],
  },
  // Only text alignment can be set with style.
  allowedStyles: {
    "*": { "text-align": [/^(left|right|center|justify)$/] },
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesByTag: { img: ["http", "https"] },
  allowProtocolRelative: false,
  // Content of script/style/iframe-like tags is thrown away, not shown as text.
  nonTextTags: ["script", "style", "textarea", "option", "noscript", "iframe", "object", "embed"],
  transformTags: {
    a: (tagName, attribs) => {
      const out: Record<string, string> = { ...attribs };
      if (out.target && out.target !== "_blank") delete out.target;
      if (out.target === "_blank") out.rel = "noopener noreferrer";
      else delete out.rel;
      return { tagName, attribs: out };
    },
    img: (tagName, attribs) => ({ tagName, attribs: { ...attribs, loading: "lazy" } }),
    // The page title is the only <h1>; headings from the editor start at <h2>.
    h1: "h2",
    h5: "h4",
    h6: "h4",
  },
};

export function cleanHtml(dirty: string): string {
  return sanitizeHtml(dirty, OPTIONS);
}
