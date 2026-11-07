import type { DataProvider, RaRecord } from "react-admin";
import { HttpError } from "react-admin";

/** React Admin resource → API path (all under /api/v1/admin, same origin via Next.js rewrites). */
const PATHS: Record<string, string> = {
  products: "admin/products",
  categories: "admin/categories",
  "option-groups": "admin/option-groups",
  orders: "admin/orders",
  quotes: "admin/quotes",
  pages: "admin/pages",
};

const LOCALES = ["en"] as const;
type Translation = { locale: string } & Record<string, unknown>;

async function call<T>(path: string, init?: RequestInit): Promise<{ json: T; headers: Headers }> {
  const res = await fetch(`/api/v1/${path}`, {
    ...init,
    credentials: "same-origin",
    cache: "no-store",
    headers: init?.body && typeof init.body === "string" ? { "Content-Type": "application/json" } : init?.headers,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const details = json?.errors?.fieldErrors ?? json?.errors?.formErrors;
    const extra = details && Object.keys(details).length ? `: ${JSON.stringify(details)}` : "";
    throw new HttpError(`${json?.message ?? res.statusText}${extra}`, res.status, json);
  }
  return { json: json as T, headers: res.headers };
}

const pathFor = (resource: string) => {
  const p = PATHS[resource];
  if (!p) throw new Error(`Unknown resource ${resource}`);
  return p;
};

/** Translations always become [en] so the forms can use fixed fields (translations.0 / translations.1). */
function withTabs(list: Translation[] | undefined, empty: Record<string, string>): Translation[] {
  return LOCALES.map((locale) => list?.find((t) => t.locale === locale) ?? { locale, ...empty });
}

/** On save: empty texts are not sent (English is required). */
function filled(list: Translation[] | undefined, key: string) {
  return (list ?? []).filter((t) => t.locale === "en" || String(t[key] ?? "").trim() !== "");
}

function fromApi(resource: string, r: RaRecord): RaRecord {
  if (resource === "products" || resource === "categories") {
    return { ...r, translations: withTabs(r.translations, { name: "", description: "" }) };
  }
  if (resource === "option-groups") {
    return {
      ...r,
      translations: withTabs(r.translations, { name: "" }),
      values: (r.values ?? []).map((v: RaRecord) => ({ ...v, translations: withTabs(v.translations, { label: "" }) })),
    };
  }
  return r;
}

function toApi(resource: string, data: Partial<RaRecord>): unknown {
  switch (resource) {
    case "products":
      return {
        slug: data.slug,
        categoryId: data.categoryId,
        material: data.material,
        basePrice: data.basePrice,
        published: !!data.published,
        featured: !!data.featured,
        translations: filled(data.translations, "name"),
        images: (data.images ?? []).filter((i: { url?: string }) => i?.url),
        optionGroupIds: data.optionGroupIds ?? [],
      };
    case "categories":
      return {
        slug: data.slug,
        type: data.type,
        imageUrl: data.imageUrl ?? "",
        sortOrder: data.sortOrder ?? 0,
        translations: filled(data.translations, "name"),
      };
    case "option-groups":
      return {
        sortOrder: data.sortOrder ?? 0,
        translations: filled(data.translations, "name"),
        values: (data.values ?? []).map((v: RaRecord) => ({
          id: v.id || undefined,
          code: v.code,
          priceDelta: v.priceDelta ?? 0,
          swatch: v.swatch ?? "",
          isDefault: !!v.isDefault,
          translations: filled(v.translations, "label"),
        })),
      };
    case "pages":
      return {
        slug: data.slug,
        title: data.title,
        content: data.content ?? "",
        seoTitle: data.seoTitle ?? "",
        seoDescription: data.seoDescription ?? "",
        status: data.status,
        showInFooter: !!data.showInFooter,
        sortOrder: Number(data.sortOrder ?? 0),
      };
    case "orders":
    case "quotes":
      return { status: data.status };
    default:
      return data;
  }
}

export const dataProvider: DataProvider = {
  async getList(resource, params) {
    const { page, perPage } = params.pagination ?? { page: 1, perPage: 25 };
    const { field, order } = params.sort ?? { field: "createdAt", order: "DESC" };
    const query = new URLSearchParams({
      page: String(page),
      perPage: String(perPage),
      sort: field,
      order,
      filter: JSON.stringify(params.filter ?? {}),
    });
    const { json, headers } = await call<RaRecord[]>(`${pathFor(resource)}?${query}`);
    const range = headers.get("Content-Range");
    return { data: json.map((r) => fromApi(resource, r)) as never[], total: range ? Number(range.split("/").at(-1)) : json.length };
  },
  async getOne(resource, params) {
    const { json } = await call<RaRecord>(`${pathFor(resource)}/${encodeURIComponent(String(params.id))}`);
    return { data: fromApi(resource, json) as never };
  },
  async getMany(resource, params) {
    // Small lists (categories, option groups): load the list and pick the ids.
    const { data } = await this.getList(resource, { pagination: { page: 1, perPage: 100 }, sort: { field: "id", order: "ASC" }, filter: {} });
    return { data: data.filter((r) => params.ids.includes(r.id)) as never };
  },
  async getManyReference(resource, params) {
    return this.getList(resource, { ...params, filter: { ...params.filter, [params.target]: params.id } }) as never;
  },
  async create(resource, params) {
    const { json } = await call<RaRecord>(pathFor(resource), { method: "POST", body: JSON.stringify(toApi(resource, params.data)) });
    return { data: fromApi(resource, json) as never };
  },
  async update(resource, params) {
    const { json } = await call<RaRecord>(`${pathFor(resource)}/${encodeURIComponent(String(params.id))}`, {
      method: "PUT",
      body: JSON.stringify(toApi(resource, params.data)),
    });
    return { data: fromApi(resource, json) as never };
  },
  async updateMany() {
    throw new Error("Not supported");
  },
  async delete(resource, params) {
    const { json } = await call<RaRecord>(`${pathFor(resource)}/${encodeURIComponent(String(params.id))}`, { method: "DELETE" });
    return { data: json as never };
  },
  async deleteMany() {
    throw new Error("Delete items one by one");
  },
};

/** Uploads one image file; returns its URL. The browser makes big photos smaller first. */
export async function uploadImage(file: File): Promise<string> {
  const blob = await shrink(file);
  const res = await fetch("/api/v1/admin/uploads", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": blob.type || "application/octet-stream" },
    body: blob,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message ?? `Upload failed (${res.status})`);
  return json.url as string;
}

async function shrink(file: File, maxSide = 2400): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 3 * 1024 * 1024) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    // PNG keeps transparency (door cut-outs); photos become JPEG.
    const type = file.type === "image/png" ? "image/png" : "image/jpeg";
    return await new Promise<Blob>((ok, fail) => canvas.toBlob((b) => (b ? ok(b) : fail(new Error("toBlob"))), type, 0.88));
  } catch {
    return file;
  }
}
