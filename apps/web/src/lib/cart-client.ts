"use client";

import type { CategoryType } from "@bestdoors/shared";

export type CartLine = {
  id: string;
  productId: string;
  slug: string;
  categorySlug: string;
  categoryType: CategoryType;
  material: string;
  image: { url: string; alt: string } | null;
  name: string;
  options: { groupCode: string; valueCode: string; group: string; value: string; swatch: string }[];
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type Cart = { items: CartLine[]; count: number; subtotal: number; vat: number; currency: "EUR" };

export const CART_EVENT = "bestdoors:cart";

/** Browser calls go to /api/* on the same origin (Next.js rewrites them to the Express API). */
async function call(path: string, locale: string, init?: RequestInit): Promise<Cart> {
  const res = await fetch(`/api/v1/cart${path}?locale=${locale}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Cart request failed: ${res.status}`);
  const cart = (await res.json()) as Cart;
  if (init?.method && init.method !== "GET") {
    window.dispatchEvent(new CustomEvent<Cart>(CART_EVENT, { detail: cart }));
  }
  return cart;
}

export const cartApi = {
  get: (locale: string) => call("", locale),
  add: (locale: string, productId: string, selection: Record<string, string>, quantity = 1) =>
    call("/items", locale, { method: "POST", body: JSON.stringify({ productId, selection, quantity }) }),
  update: (locale: string, id: string, quantity: number) =>
    call(`/items/${id}`, locale, { method: "PATCH", body: JSON.stringify({ quantity }) }),
  remove: (locale: string, id: string) => call(`/items/${id}`, locale, { method: "DELETE" }),
};

export type CheckoutSummary = {
  number: number;
  status: "PENDING" | "PAID" | "IN_PRODUCTION" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  email: string;
  total: number;
  currency: "EUR";
};

export const checkoutApi = {
  /** Creates the order and returns the Stripe Checkout page URL. */
  async start(locale: string): Promise<{ url: string }> {
    const res = await fetch(`/api/v1/checkout?locale=${locale}`, { method: "POST", credentials: "same-origin" });
    if (!res.ok) throw new Error(`Checkout failed: ${res.status}`);
    return res.json();
  },
  async session(id: string): Promise<CheckoutSummary> {
    const res = await fetch(`/api/v1/checkout/session/${encodeURIComponent(id)}`, {
      credentials: "same-origin",
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Checkout session failed: ${res.status}`);
    return res.json();
  },
};

/** Tells the header counter (and other listeners) that the cart is empty now. */
export function announceEmptyCart() {
  const empty: Cart = { items: [], count: 0, subtotal: 0, vat: 0, currency: "EUR" };
  window.dispatchEvent(new CustomEvent<Cart>(CART_EVENT, { detail: empty }));
}
