import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { selectionSchema } from "@bestdoors/shared";
import { validateBody } from "../middleware/validate";
import { cartService, MAX_QTY } from "../services/cart.service";
import { requestLocale } from "../lib/locale";
import { env } from "../lib/env";

export const CART_COOKIE = "bd_cart";

export function guestCartId(req: Request): string | undefined {
  const value = req.signedCookies?.[CART_COOKIE];
  return typeof value === "string" ? value : undefined;
}

function setGuestCookie(res: Response, cartId: string) {
  res.cookie(CART_COOKIE, cartId, {
    httpOnly: true,
    signed: true,
    secure: env().NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * 30,
  });
}

export function clearGuestCookie(res: Response) {
  res.clearCookie(CART_COOKIE, { path: "/" });
}

function owner(req: Request, res: Response) {
  return { userId: res.locals.user?.id as string | undefined, cartId: guestCartId(req) };
}

/** Finds or creates the cart; sets the guest cookie for new guest carts. */
async function cartFor(req: Request, res: Response) {
  const o = owner(req, res);
  const cart = (await cartService.find(o, true))!;
  if (!o.userId && cart.id !== o.cartId) setGuestCookie(res, cart.id);
  return cart;
}

export const cartRouter = Router();
cartRouter.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

cartRouter.get("/", async (req, res) => {
  const cart = await cartService.find(owner(req, res));
  res.json(await cartService.view(cart?.id, requestLocale(req)));
});

const addSchema = z.object({
  productId: z.string().min(1),
  selection: selectionSchema.default({}),
  quantity: z.coerce.number().int().min(1).max(MAX_QTY).default(1),
});

cartRouter.post("/items", validateBody(addSchema), async (req, res) => {
  const cart = await cartFor(req, res);
  const { productId, selection, quantity } = res.locals.body;
  await cartService.addItem(cart.id, productId, selection, quantity);
  res.status(201).json(await cartService.view(cart.id, requestLocale(req)));
});

const qtySchema = z.object({ quantity: z.coerce.number().int().min(1).max(MAX_QTY) });

cartRouter.patch("/items/:id", validateBody(qtySchema), async (req, res) => {
  const cart = await cartFor(req, res);
  await cartService.updateQuantity(cart.id, String(req.params.id), res.locals.body.quantity);
  res.json(await cartService.view(cart.id, requestLocale(req)));
});

cartRouter.delete("/items/:id", async (req, res) => {
  const cart = await cartFor(req, res);
  await cartService.removeItem(cart.id, String(req.params.id));
  res.json(await cartService.view(cart.id, requestLocale(req)));
});
