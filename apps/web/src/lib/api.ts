import "server-only";
import type { Locale } from "@bestdoors/shared";
import type { Category, ProductDetail, ProductList } from "./types";

const API_URL = process.env.API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Server-side fetch to the Express API. Catalog data is cached for 60 seconds. */
async function apiGet<T>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
  const url = new URL(`/api/v1${path}`, API_URL);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  }
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) throw new ApiError(res.status, `API ${res.status} for ${url.pathname}`);
  return res.json() as Promise<T>;
}

export const api = {
  categories: (locale: Locale) => apiGet<Category[]>("/categories", { locale }),
  products: (locale: Locale, query: Record<string, string | number | undefined> = {}) =>
    apiGet<ProductList>("/products", { ...query, locale }),
  product: (locale: Locale, slug: string) =>
    apiGet<ProductDetail>(`/products/${encodeURIComponent(slug)}`, { locale }),
};
