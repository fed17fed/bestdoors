import express, { Router } from "express";
import type Stripe from "stripe";
import { HttpError } from "../lib/http-error";
import { requestLocale } from "../lib/locale";
import { stripe, webhookSecret } from "../lib/stripe";
import { requireUser } from "../middleware/auth";
import { cartService } from "../services/cart.service";
import { orderService } from "../services/order.service";
import { guestCartId } from "./cart.routes";

const noStore: express.RequestHandler = (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
};

/** POST /checkout → Stripe Checkout URL. GET /checkout/session/:id → order summary. */
export const checkoutRouter = Router();
checkoutRouter.use(noStore);

checkoutRouter.post("/", async (req, res) => {
  const userId = res.locals.user?.id as string | undefined;
  const cart = await cartService.find({ userId, cartId: guestCartId(req) });
  if (!cart) throw new HttpError(400, "Cart is empty");
  res.json(await orderService.startCheckout({ cartId: cart.id, userId, locale: requestLocale(req) }));
});

checkoutRouter.get("/session/:id", async (req, res) => {
  const id = String(req.params.id);
  if (!/^cs_(test|live)_[A-Za-z0-9]{10,200}$/.test(id)) throw new HttpError(400, "Invalid session id");
  res.json(await orderService.confirmSession(id));
});

/** GET /me/orders, GET /me/orders/:number (logged-in customers). */
export const myOrdersRouter = Router();
myOrdersRouter.use(noStore, requireUser);

myOrdersRouter.get("/orders", async (_req, res) => {
  res.json(await orderService.listForUser(res.locals.user.id));
});

myOrdersRouter.get("/orders/:number", async (req, res) => {
  const number = Number(req.params.number);
  if (!Number.isInteger(number) || number < 1) throw new HttpError(400, "Invalid order number");
  res.json(await orderService.getForUser(res.locals.user.id, number));
});

/**
 * POST /stripe/webhook. Must be mounted BEFORE express.json():
 * the signature check needs the raw request body.
 */
export const stripeWebhookRouter = Router();

stripeWebhookRouter.post("/", express.raw({ type: "application/json", limit: "1mb" }), async (req, res) => {
  const signature = req.headers["stripe-signature"];
  if (typeof signature !== "string" || !Buffer.isBuffer(req.body)) {
    throw new HttpError(400, "Missing Stripe signature");
  }
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(req.body, signature, webhookSecret());
  } catch (err) {
    if (err instanceof HttpError) throw err;
    throw new HttpError(400, "Invalid Stripe signature");
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      await orderService.markPaid(event.data.object);
      break;
    case "checkout.session.expired":
    case "checkout.session.async_payment_failed":
      await orderService.cancel(event.data.object);
      break;
    default:
      // Other events are not used yet.
      break;
  }
  res.json({ received: true });
});
