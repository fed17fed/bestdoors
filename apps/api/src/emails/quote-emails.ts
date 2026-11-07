import type { CategoryType, Locale } from "@bestdoors/shared";
import type { Email } from "../lib/mailer";

export type QuoteEmailData = {
  reference: string;
  name: string;
  email: string;
  phone: string;
  doorType: CategoryType;
  widthMm: number | null;
  heightMm: number | null;
  eircode: string;
  message: string;
  photos: string[];
  productName: string | null;
  locale: Locale;
};

const DOOR_TYPE: Record<Locale, Record<CategoryType, string>> = {
  en: { INTERIOR: "Interior door", EXTERIOR: "Exterior door", PATIO: "Patio door", SLIDING: "Sliding door", FRENCH: "French doors" },
};

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function layout(locale: Locale, body: string) {
  return `<!doctype html>
<html lang="${locale}"><body style="margin:0;background:#faf8f4;font-family:Arial,Helvetica,sans-serif;color:#1d2320">
<div style="max-width:600px;margin:0 auto;padding:24px">
  <p style="font-size:22px;font-weight:800;margin:0 0 24px">Best<span style="color:#1f4d3a">Doors</span></p>
  <div style="background:#ffffff;border-radius:12px;padding:24px;line-height:1.5">${body}</div>
</div></body></html>`;
}

function rows(q: QuoteEmailData, locale: Locale) {
  const L = { type: "Door type", product: "Model", size: "Size (W × H)", eircode: "Eircode", phone: "Phone", message: "Message", photos: "Photos" };
  const size = q.widthMm || q.heightMm ? `${q.widthMm ?? "?"} × ${q.heightMm ?? "?"} mm` : "";
  return [
    [L.type, DOOR_TYPE[locale][q.doorType]],
    [L.product, q.productName ?? ""],
    [L.size, size],
    [L.eircode, q.eircode],
    [L.phone, q.phone],
    [L.message, q.message],
    [L.photos, q.photos.length ? String(q.photos.length) : ""],
  ].filter(([, v]) => v) as [string, string][];
}

function table(list: [string, string][]) {
  return `<table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px">${list
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#5d6661;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:6px 0;white-space:pre-wrap">${esc(v)}</td></tr>`,
    )
    .join("")}</table>`;
}

/** To the shop owner: all details, photo links, "Reply" goes to the customer. */
export function quoteShopEmail(q: QuoteEmailData, shopEmail: string): Email {
  const list: [string, string][] = [["Name", q.name], ["Email", q.email], ...rows(q, "en"), ["Language", q.locale.toUpperCase()]];
  const photos = q.photos
    .map((url, i) => `<a href="${esc(url)}" style="display:inline-block;margin:4px 8px 0 0"><img src="${esc(url)}" alt="Photo ${i + 1}" width="120" style="border-radius:8px;border:1px solid #e4e0d8"></a>`)
    .join("");
  const html = layout(
    "en",
    `<h1 style="font-size:20px;margin:0 0 16px">New quote request ${esc(q.reference)}</h1>${table(list)}${photos ? `<p style="margin:16px 0 0">${photos}</p>` : ""}
<p style="margin:16px 0 0;color:#5d6661;font-size:13px">Reply to this email to answer ${esc(q.name)} directly.</p>`,
  );
  const text = [`New quote request ${q.reference}`, "", ...list.map(([k, v]) => `${k}: ${v}`), ...q.photos.map((u, i) => `Photo ${i + 1}: ${u}`)].join("\n");
  return { to: shopEmail, replyTo: q.email, subject: `New quote request ${q.reference}: ${DOOR_TYPE.en[q.doorType]} (${q.name})`, html, text };
}

/** To the customer. */
export function quoteCustomerEmail(q: QuoteEmailData): Email {
  const t = {
    subject: `We received your quote request ${q.reference}`,
    hello: `Thank you, ${q.name}!`,
    intro: "We have received your request for a custom quote. Our specialist will review it and contact you.",
    summary: "Your request",
    footer: "Mr.Door · Made in Ireland – modern, functional, and reliable.",
  };
  const list = rows(q, q.locale);
  const html = layout(
    q.locale,
    `<h1 style="font-size:20px;margin:0 0 8px">${esc(t.hello)}</h1><p style="margin:0 0 16px">${esc(t.intro)}</p>
<h2 style="font-size:15px;margin:0 0 8px">${esc(t.summary)} ${esc(q.reference)}</h2>${table(list)}
<p style="margin:16px 0 0;color:#5d6661;font-size:12px">${esc(t.footer)}</p>`,
  );
  const text = [t.hello, t.intro, "", `${t.summary} ${q.reference}`, ...list.map(([k, v]) => `${k}: ${v}`), "", t.footer].join("\n");
  return { to: q.email, subject: t.subject, html, text };
}
