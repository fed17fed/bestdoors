import type { CategoryInput, OptionGroupInput, ProductInput } from "@bestdoors/shared";
import { Prisma } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";
import { HttpError, notFound } from "../lib/http-error";
import { assertValidParent } from "../lib/category-tree";

export type ListParams = {
  page: number;
  perPage: number;
  sort: string;
  order: "asc" | "desc";
  search: string;
};

const adminProductInclude = {
  translations: true,
  images: { orderBy: { sortOrder: "asc" } },
  optionGroups: true,
} satisfies Prisma.ProductInclude;

type AdminProduct = Prisma.ProductGetPayload<{ include: typeof adminProductInclude }>;

/** Flat record for React Admin. `name` is the English name, for list views. */
function toAdminProduct(p: AdminProduct) {
  return {
    id: p.id,
    slug: p.slug,
    categoryId: p.categoryId,
    material: p.material,
    basePrice: Number(p.basePrice),
    published: p.published,
    featured: p.featured,
    name: p.translations.find((t) => t.locale === "en")?.name ?? p.slug,
    translations: p.translations.map(({ locale, name, description }) => ({ locale, name, description })),
    images: p.images.map(({ url, alt }) => ({ url, alt })),
    optionGroupIds: p.optionGroups.map((g) => g.optionGroupId),
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

function productData(input: ProductInput) {
  return {
    slug: input.slug,
    material: input.material,
    basePrice: new Prisma.Decimal(input.basePrice),
    published: input.published,
    featured: input.featured,
    category: { connect: { id: input.categoryId } },
    translations: { create: input.translations },
    images: { create: input.images.map((img, i) => ({ ...img, sortOrder: i })) },
    optionGroups: { create: input.optionGroupIds.map((optionGroupId) => ({ optionGroupId })) },
  };
}

export const adminService = {
  async listProducts({ page, perPage, sort, order, search }: ListParams) {
    const allowedSort = ["slug", "basePrice", "createdAt", "updatedAt", "material", "published"];
    const where: Prisma.ProductWhereInput = search
      ? {
          OR: [
            { slug: { contains: search, mode: "insensitive" } },
            { material: { contains: search, mode: "insensitive" } },
            { translations: { some: { name: { contains: search, mode: "insensitive" } } } },
          ],
        }
      : {};
    const [rows, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        include: adminProductInclude,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { [allowedSort.includes(sort) ? sort : "createdAt"]: order },
      }),
      prisma.product.count({ where }),
    ]);
    return { data: rows.map(toAdminProduct), total };
  },

  async getProduct(id: string) {
    const p = await prisma.product.findUnique({ where: { id }, include: adminProductInclude });
    if (!p) throw notFound("Product");
    return toAdminProduct(p);
  },

  async createProduct(input: ProductInput) {
    const p = await prisma.product.create({ data: productData(input), include: adminProductInclude });
    return toAdminProduct(p);
  },

  /** Replaces translations, images and option links in one transaction. */
  async updateProduct(id: string, input: ProductInput) {
    const p = await prisma.$transaction(async (tx) => {
      await tx.productTranslation.deleteMany({ where: { productId: id } });
      await tx.productImage.deleteMany({ where: { productId: id } });
      await tx.productOptionGroup.deleteMany({ where: { productId: id } });
      return tx.product.update({ where: { id }, data: productData(input), include: adminProductInclude });
    });
    return toAdminProduct(p);
  },

  async deleteProduct(id: string) {
    const p = await prisma.product.delete({ where: { id }, include: adminProductInclude });
    return toAdminProduct(p);
  },

  async listCategories() {
    const rows = await prisma.category.findMany({
      include: { translations: true, _count: { select: { products: true } } },
      orderBy: { sortOrder: "asc" },
    });
    const nameOf = (c: (typeof rows)[number]) => c.translations.find((t) => t.locale === "en")?.name ?? c.slug;
    return rows.map((c) => ({
      ...c,
      name: nameOf(c),
      parentName: rows.find((p) => p.id === c.parentId) ? nameOf(rows.find((p) => p.id === c.parentId)!) : null,
      translations: c.translations.map(({ locale, name, description }) => ({ locale, name, description })),
    }));
  },

  async getCategory(id: string) {
    const all = await this.listCategories();
    const c = all.find((x) => x.id === id);
    if (!c) throw notFound("Category");
    return c;
  },

  async checkParent(id: string | undefined, parentId: string | null) {
    const parent = parentId ? await prisma.category.findUnique({ where: { id: parentId }, select: { id: true, parentId: true } }) : null;
    const childCount = id ? await prisma.category.count({ where: { parentId: id } }) : 0;
    assertValidParent({ id, parentId, parent, childCount });
  },

  async createCategory(input: CategoryInput) {
    await this.checkParent(undefined, input.parentId);
    const c = await prisma.category.create({
      data: { ...input, translations: { create: input.translations } },
    });
    return this.getCategory(c.id);
  },

  async updateCategory(id: string, input: CategoryInput) {
    await this.getCategory(id);
    await this.checkParent(id, input.parentId);
    await prisma.$transaction(async (tx) => {
      await tx.categoryTranslation.deleteMany({ where: { categoryId: id } });
      await tx.category.update({
        where: { id },
        data: { ...input, translations: { create: input.translations } },
      });
    });
    return this.getCategory(id);
  },

  async deleteCategory(id: string) {
    const c = await this.getCategory(id);
    if (await prisma.category.count({ where: { parentId: id } })) {
      throw new HttpError(409, "This category has subcategories. Move or change them first.");
    }
    await prisma.category.delete({ where: { id } });
    return c;
  },

  async listOptionGroups() {
    const rows = await prisma.optionGroup.findMany({ include: optionGroupInclude, orderBy: { sortOrder: "asc" } });
    return rows.map(toAdminOptionGroup);
  },

  async getOptionGroup(id: string) {
    const g = await prisma.optionGroup.findUnique({ where: { id }, include: optionGroupInclude });
    if (!g) throw notFound("Option group");
    return toAdminOptionGroup(g);
  },

  /**
   * Updates a group and its values. Existing values keep their id (carts point to
   * value ids), new values are created, values left out are removed.
   */
  async updateOptionGroup(id: string, input: OptionGroupInput) {
    await prisma.$transaction(async (tx) => {
      const group = await tx.optionGroup.findUnique({ where: { id }, include: { values: true } });
      if (!group) throw notFound("Option group");
      await tx.optionGroup.update({ where: { id }, data: { sortOrder: input.sortOrder } });
      await tx.optionGroupTranslation.deleteMany({ where: { optionGroupId: id } });
      await tx.optionGroupTranslation.createMany({
        data: input.translations.map((t) => ({ optionGroupId: id, locale: t.locale, name: t.name })),
      });

      const keep = new Set(input.values.map((v) => v.id).filter((v): v is string => !!v && group.values.some((x) => x.id === v)));
      const removed = group.values.filter((v) => !keep.has(v.id));
      // Free the codes of removed values first, so a new value can reuse a code.
      await tx.optionValue.deleteMany({ where: { id: { in: removed.map((v) => v.id) } } });

      for (const [sortOrder, v] of input.values.entries()) {
        const data = {
          code: v.code,
          priceDelta: new Prisma.Decimal(v.priceDelta),
          swatch: v.swatch,
          isDefault: v.isDefault,
          sortOrder,
        };
        const translations = v.translations.map((t) => ({ locale: t.locale, label: t.label }));
        if (v.id && keep.has(v.id)) {
          await tx.optionValueTranslation.deleteMany({ where: { optionValueId: v.id } });
          await tx.optionValue.update({ where: { id: v.id }, data: { ...data, translations: { create: translations } } });
        } else {
          await tx.optionValue.create({ data: { ...data, optionGroupId: id, translations: { create: translations } } });
        }
      }
    });
    return this.getOptionGroup(id);
  },
};

const optionGroupInclude = {
  translations: true,
  values: { include: { translations: true }, orderBy: { sortOrder: "asc" } },
  _count: { select: { products: true } },
} satisfies Prisma.OptionGroupInclude;

type AdminOptionGroup = Prisma.OptionGroupGetPayload<{ include: typeof optionGroupInclude }>;

/** Flat record for React Admin. `name`/`label` are the English texts, for lists. */
function toAdminOptionGroup(g: AdminOptionGroup) {
  const en = (list: { locale: string }[]) => list.find((t) => t.locale === "en");
  return {
    id: g.id,
    code: g.code,
    sortOrder: g.sortOrder,
    name: (en(g.translations) as { name: string } | undefined)?.name ?? g.code,
    productCount: g._count.products,
    translations: g.translations.map(({ locale, name }) => ({ locale, name })),
    values: g.values.map((v) => ({
      id: v.id,
      code: v.code,
      priceDelta: Number(v.priceDelta),
      swatch: v.swatch,
      isDefault: v.isDefault,
      label: (en(v.translations) as { label: string } | undefined)?.label ?? v.code,
      translations: v.translations.map(({ locale, label }) => ({ locale, label })),
    })),
  };
}
