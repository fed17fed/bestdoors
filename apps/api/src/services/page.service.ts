import { CORE_PAGE_SLUGS, type PageInput } from "@bestdoors/shared";
import type { Page } from "../generated/prisma/client";
import { HttpError, notFound } from "../lib/http-error";
import { prisma } from "../lib/prisma";
import { cleanHtml } from "../lib/sanitize-html";
import type { ListParams } from "./admin.service";

const isCore = (slug: string) => (CORE_PAGE_SLUGS as readonly string[]).includes(slug);

/** Flat record for React Admin. */
function toAdminPage(p: Page) {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    content: cleanHtml(p.content),
    seoTitle: p.seoTitle,
    seoDescription: p.seoDescription,
    status: p.status,
    showInFooter: p.showInFooter,
    sortOrder: p.sortOrder,
    isCore: isCore(p.slug),
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

/** Public shape. The HTML is cleaned again on read (defence in depth). */
function toPublicPage(p: Page) {
  return {
    slug: p.slug,
    title: p.title,
    content: cleanHtml(p.content),
    seoTitle: p.seoTitle,
    seoDescription: p.seoDescription,
    showInFooter: p.showInFooter,
    sortOrder: p.sortOrder,
    updatedAt: p.updatedAt,
  };
}

const SORT_FIELDS = new Set(["title", "slug", "status", "sortOrder", "showInFooter", "createdAt", "updatedAt"]);

const slugTaken = () => new HttpError(409, "A page with this address (slug) already exists", { fieldErrors: { slug: ["Already used"] } });

export const pageService = {
  // ----- public -----
  /** All published pages (the shop uses it for the footer and the sitemap). */
  async listPublished() {
    const list = await prisma.page.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
      select: { slug: true, title: true, showInFooter: true, sortOrder: true, updatedAt: true },
    });
    return list;
  },

  /** Draft or missing pages are "not found" for visitors. */
  async getPublished(slug: string) {
    const page = await prisma.page.findUnique({ where: { slug } });
    if (!page || page.status !== "PUBLISHED") throw notFound("Page");
    return toPublicPage(page);
  },

  // ----- admin -----
  async adminList(params: ListParams) {
    const where = params.search
      ? { OR: [{ title: { contains: params.search, mode: "insensitive" as const } }, { slug: { contains: params.search, mode: "insensitive" as const } }] }
      : {};
    const sort = SORT_FIELDS.has(params.sort) ? params.sort : "sortOrder";
    const [rows, total] = await Promise.all([
      prisma.page.findMany({
        where,
        orderBy: { [sort]: params.order },
        skip: (params.page - 1) * params.perPage,
        take: params.perPage,
      }),
      prisma.page.count({ where }),
    ]);
    return { data: rows.map(toAdminPage), total };
  },

  async adminGet(id: string) {
    const page = await prisma.page.findUnique({ where: { id } });
    if (!page) throw notFound("Page");
    return toAdminPage(page);
  },

  async create(input: PageInput) {
    try {
      const page = await prisma.page.create({ data: { ...input, content: cleanHtml(input.content) } });
      return toAdminPage(page);
    } catch (e) {
      if ((e as { code?: string }).code === "P2002") throw slugTaken();
      throw e;
    }
  },

  async update(id: string, input: PageInput) {
    const current = await prisma.page.findUnique({ where: { id } });
    if (!current) throw notFound("Page");
    if (isCore(current.slug) && input.slug !== current.slug) {
      throw new HttpError(400, "The address of this page cannot be changed (the shop links to it)", {
        fieldErrors: { slug: ["Fixed for this page"] },
      });
    }
    try {
      const page = await prisma.page.update({ where: { id }, data: { ...input, content: cleanHtml(input.content) } });
      return toAdminPage(page);
    } catch (e) {
      if ((e as { code?: string }).code === "P2002") throw slugTaken();
      throw e;
    }
  },

  async remove(id: string) {
    const current = await prisma.page.findUnique({ where: { id } });
    if (!current) throw notFound("Page");
    if (isCore(current.slug)) throw new HttpError(409, "This page is required (the shop links to it), so it cannot be deleted");
    const page = await prisma.page.delete({ where: { id } });
    return toAdminPage(page);
  },
};
