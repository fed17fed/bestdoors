import type { Locale, Selection } from "@bestdoors/shared";
import { vatFromGross } from "@bestdoors/shared";
import { Prisma } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";
import { HttpError, notFound } from "../lib/http-error";
import { catalogService } from "./catalog.service";

export const MAX_QTY = 20;
const MAX_LINES = 50;

/** Same configuration = same keys and values, in any order. */
function sameSelection(a: unknown, b: Selection) {
  const x = (a ?? {}) as Selection;
  const ka = Object.keys(x).sort();
  const kb = Object.keys(b).sort();
  return ka.length === kb.length && ka.every((k, i) => k === kb[i] && x[k] === b[k]);
}

export const cartService = {
  /** Finds the cart of a user, or a guest cart by id. Creates one if `create`. */
  async find(owner: { userId?: string; cartId?: string }, create = false) {
    let cart = owner.userId
      ? await prisma.cart.findUnique({ where: { userId: owner.userId } })
      : owner.cartId
        ? await prisma.cart.findFirst({ where: { id: owner.cartId, userId: null } })
        : null;
    if (!cart && create) {
      cart = await prisma.cart.create({ data: { userId: owner.userId ?? null } });
    }
    return cart;
  },

  /**
   * Cart with prices recalculated from the catalog (server is the source of truth).
   * Items whose product or options are no longer available are removed.
   */
  async view(cartId: string | undefined, locale: Locale) {
    const items = cartId
      ? await prisma.cartItem.findMany({ where: { cartId }, orderBy: { id: "asc" } })
      : [];
    const products = await prisma.product.findMany({
      where: { id: { in: items.map((i) => i.productId) } },
      include: { category: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } },
    });

    const lines = [];
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      let priced;
      try {
        priced = await catalogService.priceProduct(item.productId, item.selection as Selection, locale);
      } catch {
        await prisma.cartItem.delete({ where: { id: item.id } });
        continue;
      }
      if (!product) continue;
      if (!new Prisma.Decimal(priced.price).equals(item.unitPrice)) {
        await prisma.cartItem.update({ where: { id: item.id }, data: { unitPrice: priced.price } });
      }
      lines.push({
        id: item.id,
        productId: item.productId,
        slug: product.slug,
        categorySlug: product.category.slug,
        categoryType: product.category.type,
        material: product.material,
        image: product.images[0] ?? null,
        name: priced.name,
        options: priced.options,
        selection: priced.selection,
        quantity: item.quantity,
        unitPrice: priced.price,
        lineTotal: Math.round(priced.price * item.quantity * 100) / 100,
      });
    }

    const subtotal = Math.round(lines.reduce((s, l) => s + l.lineTotal, 0) * 100) / 100;
    return {
      items: lines,
      count: lines.reduce((s, l) => s + l.quantity, 0),
      subtotal,
      vat: vatFromGross(subtotal),
      currency: "EUR",
    };
  },

  async addItem(cartId: string, productId: string, selection: Selection, quantity: number) {
    // Validates the product and options, and resolves defaults.
    const priced = await catalogService.priceProduct(productId, selection);
    const existing = (await prisma.cartItem.findMany({ where: { cartId, productId } })).find((i) =>
      sameSelection(i.selection, priced.selection),
    );
    if (existing) {
      return prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: Math.min(MAX_QTY, existing.quantity + quantity), unitPrice: priced.price },
      });
    }
    const lines = await prisma.cartItem.count({ where: { cartId } });
    if (lines >= MAX_LINES) throw new HttpError(400, "Cart is full");
    return prisma.cartItem.create({
      data: { cartId, productId, selection: priced.selection, quantity, unitPrice: priced.price },
    });
  },

  async updateQuantity(cartId: string, itemId: string, quantity: number) {
    const { count } = await prisma.cartItem.updateMany({ where: { id: itemId, cartId }, data: { quantity } });
    if (!count) throw notFound("Cart item");
  },

  async removeItem(cartId: string, itemId: string) {
    const { count } = await prisma.cartItem.deleteMany({ where: { id: itemId, cartId } });
    if (!count) throw notFound("Cart item");
  },

  /** On login: move guest items into the user's cart, then delete the guest cart. */
  async mergeGuestCart(guestCartId: string, userId: string) {
    const guest = await prisma.cart.findFirst({
      where: { id: guestCartId, userId: null },
      include: { items: true },
    });
    if (!guest) return;
    const userCart = await this.find({ userId }, true);
    for (const item of guest.items) {
      try {
        await this.addItem(userCart!.id, item.productId, item.selection as Selection, item.quantity);
      } catch {
        // product no longer available: skip
      }
    }
    await prisma.cart.delete({ where: { id: guest.id } });
  },
};
