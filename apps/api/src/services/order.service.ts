import type Stripe from "stripe";
import type { Locale, OrderStatus } from "@bestdoors/shared";
import type { Prisma } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";
import { env } from "../lib/env";
import { HttpError, notFound } from "../lib/http-error";
import { stripe, toCents } from "../lib/stripe";
import { sendEmail } from "../lib/mailer";
import { orderConfirmationEmail, type ShippingAddress } from "../emails/order-confirmation";
import { cartService } from "./cart.service";

/** Delivery in Ireland is free for now (decision 2026-11-05). Change it here. */
export const SHIPPING_EUR = 0;
/** A Stripe Checkout page stays open this long (Stripe allows 30 min to 24 h). */
const SESSION_MINUTES = 60;

const SHIPPING_LABEL: Record<Locale, string> = {
  en: "Free delivery in Ireland",
};

type OrderOption = { group: string; value: string; groupCode: string; valueCode: string };

const num = (d: { toString(): string }) => Number(d.toString());

function addressFrom(session: Stripe.Checkout.Session): ShippingAddress | null {
  const s = session.collected_information?.shipping_details;
  if (!s) return null;
  return {
    name: s.name,
    line1: s.address.line1 ?? "",
    line2: s.address.line2 ?? "",
    city: s.address.city ?? "",
    county: s.address.state ?? "",
    postalCode: s.address.postal_code ?? "", // Eircode
    country: s.address.country ?? "",
    phone: session.customer_details?.phone ?? "",
  };
}

export const orderService = {
  /**
   * Creates a PENDING order from the cart (prices recalculated on the server)
   * and a Stripe Checkout Session for it. Returns the Stripe page URL.
   */
  async startCheckout(input: { cartId: string; userId?: string; locale: Locale }) {
    const { cartId, userId, locale } = input;
    const cart = await cartService.view(cartId, locale);
    if (cart.items.length === 0) throw new HttpError(400, "Cart is empty");

    const user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;
    const order = await prisma.order.create({
      data: {
        userId: user?.id ?? null,
        email: user?.email ?? "", // guests: filled in from Stripe after payment
        locale,
        subtotal: cart.subtotal,
        vatAmount: cart.vat,
        shipping: SHIPPING_EUR,
        total: Math.round((cart.subtotal + SHIPPING_EUR) * 100) / 100,
        items: {
          create: cart.items.map((l) => ({
            productId: l.productId,
            productName: l.name,
            options: l.options.map(
              (o): OrderOption => ({ group: o.group, value: o.value, groupCode: o.groupCode, valueCode: o.valueCode }),
            ),
            quantity: l.quantity,
            unitPrice: l.unitPrice,
          })),
        },
      },
    });

    const web = env().WEB_URL.replace(/\/$/, "");
    try {
      const session = await stripe().checkout.sessions.create(
        {
          mode: "payment",
          client_reference_id: order.id,
          metadata: { orderId: order.id, cartId },
          payment_intent_data: { metadata: { orderId: order.id, orderNumber: String(order.number) } },
          customer_email: user?.email,
          locale: "en",
          line_items: cart.items.map((l) => ({
            quantity: l.quantity,
            price_data: {
              currency: "eur",
              unit_amount: toCents(l.unitPrice),
              tax_behavior: "inclusive",
              product_data: {
                name: l.name,
                ...(l.options.length && {
                  description: l.options.map((o) => `${o.group}: ${o.value}`).join(" · ").slice(0, 500),
                }),
                ...(l.image && /^https:\/\//.test(l.image.url) && { images: [l.image.url] }),
              },
            },
          })),
          shipping_address_collection: { allowed_countries: ["IE"] },
          shipping_options: [
            {
              shipping_rate_data: {
                type: "fixed_amount",
                display_name: SHIPPING_LABEL[locale],
                fixed_amount: { amount: toCents(SHIPPING_EUR), currency: "eur" },
              },
            },
          ],
          phone_number_collection: { enabled: true },
          expires_at: Math.floor(Date.now() / 1000) + SESSION_MINUTES * 60,
          success_url: `${web}/${locale}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${web}/${locale}/cart?checkout=cancelled`,
        },
        { idempotencyKey: `checkout-${order.id}` },
      );
      if (!session.url) throw new Error("Stripe returned no checkout URL");
      await prisma.order.update({ where: { id: order.id }, data: { stripeSessionId: session.id } });
      return { url: session.url, orderNumber: order.number };
    } catch (err) {
      await prisma.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
      if (err instanceof HttpError) throw err;
      console.error("[checkout] Stripe error:", err);
      throw new HttpError(502, "Could not start the payment. Please try again.");
    }
  },

  /**
   * Marks the order PAID when Stripe says the session is paid. Safe to call many
   * times (webhook + success page): only the first call changes the order,
   * clears the cart and sends the email.
   */
  async markPaid(session: Stripe.Checkout.Session) {
    const orderId = session.metadata?.orderId;
    if (!orderId) return false;
    if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") return false;

    const address = addressFrom(session);
    const email = session.customer_details?.email || undefined;
    const { count } = await prisma.order.updateMany({
      where: { id: orderId, stripeSessionId: session.id, status: "PENDING" },
      data: { status: "PAID", ...(address && { shippingAddress: address }), ...(email && { email }) },
    });
    if (count === 0) return false; // already paid, cancelled, or not ours

    const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true } });
    if (session.amount_total !== null && session.amount_total !== toCents(num(order.total))) {
      console.warn(`[checkout] order #${order.number}: Stripe total ${session.amount_total} ≠ order total ${num(order.total)}`);
    }

    // The customer has paid: empty the cart they paid from.
    const cartId = session.metadata?.cartId;
    if (cartId) await prisma.cartItem.deleteMany({ where: { cartId } });

    const mail = orderConfirmationEmail({
      number: order.number,
      locale: order.locale,
      email: order.email,
      createdAt: order.createdAt,
      subtotal: num(order.subtotal),
      vatAmount: num(order.vatAmount),
      shipping: num(order.shipping),
      total: num(order.total),
      shippingAddress: address,
      items: order.items.map((i) => ({
        productName: i.productName,
        options: i.options as OrderOption[],
        quantity: i.quantity,
        unitPrice: num(i.unitPrice),
      })),
    });
    if (order.email) await sendEmail(mail);
    const shop = env().SHOP_EMAIL;
    if (shop) await sendEmail({ ...mail, to: shop, subject: `[Shop copy] ${mail.subject}` });
    return true;
  },

  /** Session expired or async payment failed: the PENDING order is cancelled. */
  async cancel(session: Stripe.Checkout.Session) {
    const orderId = session.metadata?.orderId;
    if (!orderId) return false;
    const { count } = await prisma.order.updateMany({
      where: { id: orderId, stripeSessionId: session.id, status: "PENDING" },
      data: { status: "CANCELLED" },
    });
    return count > 0;
  },

  /** Success page: checks the session with Stripe (works even before the webhook arrives). */
  async confirmSession(sessionId: string) {
    let session: Stripe.Checkout.Session;
    try {
      session = await stripe().checkout.sessions.retrieve(sessionId);
    } catch (err) {
      if (err instanceof HttpError) throw err;
      throw notFound("Checkout session");
    }
    await this.markPaid(session);
    const order = await prisma.order.findFirst({ where: { stripeSessionId: session.id } });
    if (!order) throw notFound("Order");
    return {
      number: order.number,
      status: order.status,
      email: order.email,
      total: num(order.total),
      currency: "EUR",
    };
  },

  /** Orders of a logged-in customer (newest first). */
  async listForUser(userId: string) {
    const orders = await prisma.order.findMany({
      where: { userId, status: { not: "PENDING" } },
      orderBy: { createdAt: "desc" },
      include: { items: true },
    });
    return orders.map((o) => this.toPublic(o));
  },

  async getForUser(userId: string, number: number) {
    const order = await prisma.order.findFirst({ where: { userId, number }, include: { items: true } });
    if (!order) throw notFound("Order");
    return this.toPublic(order);
  },

  // ----- admin (React Admin) -----
  async adminList(p: { page: number; perPage: number; sort: string; order: "asc" | "desc"; search: string; status?: OrderStatus }) {
    const sortable = ["createdAt", "number", "status", "total", "email"];
    const n = Number(p.search.replace(/^#/, ""));
    const where: Prisma.OrderWhereInput = {
      ...(p.status && { status: p.status }),
      ...(p.search && {
        OR: [
          { email: { contains: p.search, mode: "insensitive" } },
          ...(Number.isInteger(n) && n > 0 && n < 2 ** 31 ? [{ number: n }] : []),
        ],
      }),
    };
    const [rows, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { items: true },
        orderBy: { [sortable.includes(p.sort) ? p.sort : "createdAt"]: p.order },
        skip: (p.page - 1) * p.perPage,
        take: p.perPage,
      }),
      prisma.order.count({ where }),
    ]);
    return { data: rows.map((o) => this.toAdmin(o)), total };
  },

  async adminGet(id: string) {
    const o = await prisma.order.findUnique({ where: { id }, include: { items: true } });
    if (!o) throw notFound("Order");
    return this.toAdmin(o);
  },

  /** Admin changes the status (e.g. PAID → IN_PRODUCTION → SHIPPED). Payment states come only from Stripe. */
  async adminSetStatus(id: string, status: OrderStatus) {
    if (status === "PENDING" || status === "PAID") {
      throw new HttpError(400, "PENDING and PAID are set by Stripe only");
    }
    const o = await prisma.order.findUnique({ where: { id } });
    if (!o) throw notFound("Order");
    if (o.status === "PENDING" && status !== "CANCELLED") {
      throw new HttpError(400, "This order is not paid yet");
    }
    await prisma.order.update({ where: { id }, data: { status } });
    return this.adminGet(id);
  },

  toAdmin(o: Prisma.OrderGetPayload<{ include: { items: true } }>) {
    return {
      id: o.id,
      userId: o.userId,
      locale: o.locale,
      stripeSessionId: o.stripeSessionId,
      updatedAt: o.updatedAt,
      itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
      ...this.toPublic(o),
    };
  },

  toPublic(o: Prisma.OrderGetPayload<{ include: { items: true } }>) {
    return {
      number: o.number,
      status: o.status,
      createdAt: o.createdAt,
      email: o.email,
      subtotal: num(o.subtotal),
      vatAmount: num(o.vatAmount),
      shipping: num(o.shipping),
      total: num(o.total),
      shippingAddress: o.shippingAddress,
      items: o.items.map((i) => ({
        productId: i.productId,
        productName: i.productName,
        options: i.options,
        quantity: i.quantity,
        unitPrice: num(i.unitPrice),
      })),
    };
  },
};
