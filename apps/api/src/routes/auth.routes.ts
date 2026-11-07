import { Router, type Request, type Response } from "express";
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from "@bestdoors/shared";
import { validateBody } from "../middleware/validate";
import { clearSession, requireUser, setSession } from "../middleware/auth";
import { authService } from "../services/auth.service";
import { notFound } from "../lib/http-error";
import { cartService } from "../services/cart.service";
import { clearGuestCookie, guestCartId } from "./cart.routes";

/** Moves the guest cart (if any) into the user's cart. */
async function adoptGuestCart(req: Request, res: Response, userId: string) {
  const id = guestCartId(req);
  if (!id) return;
  await cartService.mergeGuestCart(id, userId);
  clearGuestCookie(res);
}

export const authRouter = Router();

authRouter.post("/register", validateBody(registerSchema), async (req, res) => {
  const user = await authService.register(res.locals.body);
  setSession(res, user);
  await adoptGuestCart(req, res, user.id);
  res.status(201).json(user);
});

authRouter.post("/login", validateBody(loginSchema), async (req, res) => {
  const { email, password } = res.locals.body;
  const user = await authService.login(email, password);
  setSession(res, user);
  await adoptGuestCart(req, res, user.id);
  res.json(user);
});

// Always 204, so nobody can check which emails are registered.
authRouter.post("/forgot-password", validateBody(forgotPasswordSchema), async (_req, res) => {
  await authService.requestPasswordReset(res.locals.body.email);
  res.status(204).end();
});

authRouter.post("/reset-password", validateBody(resetPasswordSchema), async (_req, res) => {
  const { token, password } = res.locals.body;
  await authService.resetPassword(token, password);
  res.status(204).end();
});

authRouter.post("/logout", (_req, res) => {
  clearSession(res);
  res.status(204).end();
});

authRouter.get("/me", requireUser, async (_req, res) => {
  const user = await authService.me(res.locals.user.id);
  if (!user) throw notFound("User");
  res.json(user);
});
