import type { Locale, ProductListQuery, Selection } from "@bestdoors/shared";
import { Prisma } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";
import { pickTranslation } from "../lib/locale";
import { HttpError, notFound } from "../lib/http-error";

const productInclude = {
  translations: true,
  images: { orderBy: { sortOrder: "asc" } },
  category: { include: { translations: true } },
} satisfies Prisma.ProductInclude;

type ProductWithBasics = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

function toProductCard(p: ProductWithBasics, locale: Locale) {
  const t = pickTranslation(p.translations, locale);
  const ct = pickTranslation(p.category.translations, locale);
  return {
    id: p.id,
    slug: p.slug,
    name: t?.name ?? p.slug,
    description: t?.description ?? "",
    material: p.material,
    price: Number(p.basePrice),
    featured: p.featured,
    image: p.images[0] ?? null,
    category: { slug: p.category.slug, type: p.category.type, name: ct?.name ?? p.category.slug },
  };
}

export const catalogService = {
  async listCategories(locale: Locale) {
    const categories = await prisma.category.findMany({
      include: { translations: true, _count: { select: { products: { where: { published: true } } } } },
      orderBy: { sortOrder: "asc" },
    });
    return categories.map((c) => {
      const t = pickTranslation(c.translations, locale);
      return {
        id: c.id,
        slug: c.slug,
        type: c.type,
        imageUrl: c.imageUrl,
        parentId: c.parentId,
        name: t?.name ?? c.slug,
        description: t?.description ?? "",
        productCount: c._count.products,
      };
    });
  },

  async listProducts(q: ProductListQuery) {
    const where: Prisma.ProductWhereInput = { published: true };
    if (q.category) where.category = { slug: q.category };
    if (q.material) where.material = { equals: q.material, mode: "insensitive" };
    if (q.minPrice !== undefined || q.maxPrice !== undefined) {
      where.basePrice = { gte: q.minPrice, lte: q.maxPrice };
    }
    if (q.q) {
      where.translations = { some: { name: { contains: q.q, mode: "insensitive" } } };
    }
    const orderBy: Prisma.ProductOrderByWithRelationInput =
      q.sort === "price-asc"
        ? { basePrice: "asc" }
        : q.sort === "price-desc"
          ? { basePrice: "desc" }
          : q.sort === "name"
            ? { slug: "asc" }
            : { createdAt: "desc" };

    const [rows, total, materials] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        include: productInclude,
        orderBy,
        skip: (q.page - 1) * q.perPage,
        take: q.perPage,
      }),
      prisma.product.count({ where }),
      prisma.product.findMany({
        where: { published: true, ...(q.category ? { category: { slug: q.category } } : {}) },
        distinct: ["material"],
        select: { material: true },
        orderBy: { material: "asc" },
      }),
    ]);

    return {
      data: rows.map((p) => toProductCard(p, q.locale)),
      total,
      page: q.page,
      perPage: q.perPage,
      facets: { materials: materials.map((m) => m.material) },
    };
  },

  async getProductBySlug(slug: string, locale: Locale) {
    const p = await prisma.product.findFirst({
      where: { slug, published: true },
      include: {
        ...productInclude,
        optionGroups: {
          include: {
            optionGroup: {
              include: {
                translations: true,
                values: { include: { translations: true }, orderBy: { sortOrder: "asc" } },
              },
            },
          },
        },
      },
    });
    if (!p) throw notFound("Product");

    const optionGroups = p.optionGroups
      .map(({ optionGroup: g }) => ({
        id: g.id,
        code: g.code,
        sortOrder: g.sortOrder,
        name: pickTranslation(g.translations, locale)?.name ?? g.code,
        values: g.values.map((v) => ({
          id: v.id,
          code: v.code,
          label: pickTranslation(v.translations, locale)?.label ?? v.code,
          priceDelta: Number(v.priceDelta),
          swatch: v.swatch,
          isDefault: v.isDefault,
        })),
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder);

    return { ...toProductCard(p, locale), images: p.images, optionGroups };
  },

  /**
   * Server-side price for a configured product. Missing groups use their default value.
   * Returns the price and the resolved selection (groupId -> valueId).
   */
  async priceProduct(productId: string, selection: Selection, locale: Locale = "en") {
    const p = await prisma.product.findFirst({
      where: { id: productId, published: true },
      include: {
        translations: true,
        optionGroups: {
          include: {
            optionGroup: {
              include: { translations: true, values: { include: { translations: true } } },
            },
          },
        },
      },
    });
    if (!p) throw notFound("Product");

    let price = new Prisma.Decimal(p.basePrice);
    const resolved: Selection = {};
    const labels: { groupCode: string; valueCode: string; group: string; value: string; swatch: string }[] = [];

    for (const { optionGroup: g } of p.optionGroups) {
      const chosenId = selection[g.id];
      const value = chosenId
        ? g.values.find((v) => v.id === chosenId)
        : (g.values.find((v) => v.isDefault) ?? g.values[0]);
      if (!value) throw new HttpError(400, `Invalid option for ${g.code}`);
      price = price.add(value.priceDelta);
      resolved[g.id] = value.id;
      labels.push({
        groupCode: g.code,
        valueCode: value.code,
        swatch: value.swatch,
        group: pickTranslation(g.translations, locale)?.name ?? g.code,
        value: pickTranslation(value.translations, locale)?.label ?? value.code,
      });
    }

    const unknown = Object.keys(selection).filter((id) => !(id in resolved));
    if (unknown.length) throw new HttpError(400, "Option not available for this product");

    return {
      productId: p.id,
      slug: p.slug,
      material: p.material,
      name: pickTranslation(p.translations, locale)?.name ?? p.slug,
      price: Number(price.toFixed(2)),
      selection: resolved,
      options: labels,
    };
  },
};
