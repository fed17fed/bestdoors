import type { QuoteInput, QuoteStatus } from "@bestdoors/shared";
import type { Prisma } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";
import { env } from "../lib/env";
import { HttpError, notFound } from "../lib/http-error";
import { sendEmail } from "../lib/mailer";
import { isOurPhoto } from "../lib/storage";
import { pickTranslation } from "../lib/locale";
import { quoteCustomerEmail, quoteShopEmail } from "../emails/quote-emails";

/** Short reference the customer can quote, e.g. "Q-7K2D9F". */
export const quoteReference = (id: string) => `Q-${id.slice(-6).toUpperCase()}`;

type ListParams = { page: number; perPage: number; sort: string; order: "asc" | "desc"; search: string; status?: QuoteStatus };

export const quoteService = {
  async create(input: QuoteInput) {
    const photos = [...new Set(input.photos)];
    if (photos.some((url) => !isOurPhoto(url, "quotes"))) throw new HttpError(400, "Invalid photo");

    let productName: string | null = null;
    let productId: string | null = null;
    if (input.productId) {
      const product = await prisma.product.findFirst({
        where: { id: input.productId, published: true },
        include: { translations: true },
      });
      if (product) {
        productId = product.id;
        productName = pickTranslation(product.translations, input.locale)?.name ?? null;
      }
    }

    const quote = await prisma.quoteRequest.create({
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone,
        doorType: input.doorType,
        widthMm: input.widthMm ?? null,
        heightMm: input.heightMm ?? null,
        eircode: input.eircode,
        message: input.message,
        photos,
        productId,
        locale: input.locale,
      },
    });
    const reference = quoteReference(quote.id);

    const data = { ...quote, reference, productName };
    await sendEmail(quoteCustomerEmail(data));
    const shop = env().SHOP_EMAIL;
    if (shop) await sendEmail(quoteShopEmail(data, shop));
    else console.warn(`[quotes] SHOP_EMAIL is not set: nobody was told about quote ${reference}`);

    return { id: quote.id, reference };
  },

  // ----- admin (React Admin) -----
  async list(p: ListParams) {
    const sortable = ["createdAt", "status", "name", "email", "doorType"];
    const where: Prisma.QuoteRequestWhereInput = {
      ...(p.status && { status: p.status }),
      ...(p.search && {
        OR: [
          { name: { contains: p.search, mode: "insensitive" } },
          { email: { contains: p.search, mode: "insensitive" } },
          { eircode: { contains: p.search, mode: "insensitive" } },
        ],
      }),
    };
    const [data, total] = await Promise.all([
      prisma.quoteRequest.findMany({
        where,
        orderBy: { [sortable.includes(p.sort) ? p.sort : "createdAt"]: p.order },
        skip: (p.page - 1) * p.perPage,
        take: p.perPage,
      }),
      prisma.quoteRequest.count({ where }),
    ]);
    return { data: data.map((q) => ({ ...q, reference: quoteReference(q.id) })), total };
  },

  async get(id: string) {
    const q = await prisma.quoteRequest.findUnique({ where: { id } });
    if (!q) throw notFound("Quote request");
    return { ...q, reference: quoteReference(q.id) };
  },

  async setStatus(id: string, status: QuoteStatus) {
    const { count } = await prisma.quoteRequest.updateMany({ where: { id }, data: { status } });
    if (!count) throw notFound("Quote request");
    return this.get(id);
  },
};
