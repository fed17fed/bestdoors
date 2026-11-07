import { formatPrice, INTL_LOCALE, type Locale } from "@bestdoors/shared";
import type { Email } from "../lib/mailer";

export type OrderEmailData = {
  number: number;
  locale: Locale;
  email: string;
  createdAt: Date;
  subtotal: number;
  vatAmount: number;
  shipping: number;
  total: number;
  items: { productName: string; options: { group: string; value: string }[]; quantity: number; unitPrice: number }[];
  shippingAddress: ShippingAddress | null;
};

export type ShippingAddress = {
  name: string;
  line1: string;
  line2: string;
  city: string;
  county: string;
  postalCode: string;
  country: string;
  phone: string;
};

const TEXT = {
  en: {
    subject: (n: number) => `Mr.Door order #${n} confirmed`,
    hello: "Thank you for your order!",
    intro: (n: number) =>
      `We have received your payment for order #${n}. We will contact you soon about production and delivery.`,
    qty: "Qty",
    subtotal: "Subtotal",
    vat: "Of which VAT (23%)",
    delivery: "Delivery",
    free: "Free",
    total: "Total paid",
    address: "Delivery address",
    date: "Order date",
    footer: "Mr.Door · Made in Ireland – modern, functional, and reliable.",
  },
} satisfies Record<Locale, unknown>;

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function addressLines(a: ShippingAddress | null): string[] {
  if (!a) return [];
  return [a.name, a.line1, a.line2, [a.city, a.county].filter(Boolean).join(", "), a.postalCode, a.country, a.phone].filter(
    Boolean,
  );
}

export function orderConfirmationEmail(order: OrderEmailData): Email {
  const t = TEXT[order.locale];
  const money = (n: number) => formatPrice(n, order.locale);
  const date = new Intl.DateTimeFormat(INTL_LOCALE[order.locale], { dateStyle: "long" }).format(order.createdAt);
  const address = addressLines(order.shippingAddress);
  const shipping = order.shipping > 0 ? money(order.shipping) : t.free;

  const rows = order.items
    .map((i) => {
      const opts = i.options.map((o) => `${esc(o.group)}: ${esc(o.value)}`).join("<br>");
      return `<tr>
  <td style="padding:12px 0;border-bottom:1px solid #e4e0d8;vertical-align:top">
    <strong>${esc(i.productName)}</strong><br><span style="color:#5d6661;font-size:13px">${opts}</span>
  </td>
  <td style="padding:12px 8px;border-bottom:1px solid #e4e0d8;text-align:center;vertical-align:top">${i.quantity}</td>
  <td style="padding:12px 0;border-bottom:1px solid #e4e0d8;text-align:right;vertical-align:top;white-space:nowrap">${money(i.unitPrice * i.quantity)}</td>
</tr>`;
    })
    .join("");

  const sum = (label: string, value: string, bold = false) =>
    `<tr><td colspan="2" style="padding:4px 0;${bold ? "font-weight:700;font-size:16px" : "color:#5d6661"}">${label}</td><td style="padding:4px 0;text-align:right;${bold ? "font-weight:700;font-size:16px" : ""}">${value}</td></tr>`;

  const html = `<!doctype html>
<html lang="${order.locale}"><body style="margin:0;background:#faf8f4;font-family:Arial,Helvetica,sans-serif;color:#1d2320">
<div style="max-width:600px;margin:0 auto;padding:24px">
  <p style="font-size:22px;font-weight:800;margin:0 0 24px">Best<span style="color:#1f4d3a">Doors</span></p>
  <div style="background:#ffffff;border-radius:12px;padding:24px">
    <h1 style="font-size:20px;margin:0 0 8px">${t.hello}</h1>
    <p style="margin:0 0 16px;line-height:1.5">${esc(t.intro(order.number))}</p>
    <p style="margin:0 0 16px;color:#5d6661;font-size:13px">${t.date}: ${esc(date)}</p>
    <table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px">
      <tr><th style="text-align:left;padding-bottom:8px;border-bottom:1px solid #e4e0d8"></th>
          <th style="padding-bottom:8px;border-bottom:1px solid #e4e0d8;font-size:12px;color:#5d6661">${t.qty}</th>
          <th style="padding-bottom:8px;border-bottom:1px solid #e4e0d8"></th></tr>
      ${rows}
      ${sum(t.subtotal, money(order.subtotal))}
      ${sum(t.vat, money(order.vatAmount))}
      ${sum(t.delivery, shipping)}
      ${sum(t.total, money(order.total), true)}
    </table>
    ${
      address.length
        ? `<h2 style="font-size:15px;margin:24px 0 8px">${t.address}</h2><p style="margin:0;line-height:1.5">${address.map(esc).join("<br>")}</p>`
        : ""
    }
  </div>
  <p style="color:#5d6661;font-size:12px;margin-top:16px">${t.footer}</p>
</div></body></html>`;

  const text = [
    t.hello,
    t.intro(order.number),
    `${t.date}: ${date}`,
    "",
    ...order.items.map(
      (i) =>
        `${i.quantity} × ${i.productName} (${i.options.map((o) => `${o.group}: ${o.value}`).join(", ")}) — ${money(i.unitPrice * i.quantity)}`,
    ),
    "",
    `${t.subtotal}: ${money(order.subtotal)}`,
    `${t.vat}: ${money(order.vatAmount)}`,
    `${t.delivery}: ${shipping}`,
    `${t.total}: ${money(order.total)}`,
    ...(address.length ? ["", `${t.address}:`, ...address] : []),
    "",
    t.footer,
  ].join("\n");

  return { to: order.email, subject: t.subject(order.number), html, text };
}
