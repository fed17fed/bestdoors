import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import { loadUser } from "./middleware/auth";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";
import { catalogRouter } from "./routes/catalog.routes";
import { authRouter } from "./routes/auth.routes";
import { adminRouter } from "./routes/admin.routes";
import { cartRouter } from "./routes/cart.routes";
import { checkoutRouter, myOrdersRouter, stripeWebhookRouter } from "./routes/checkout.routes";
import { env } from "./lib/env";
import { adminQuoteRouter, quoteRouter } from "./routes/quote.routes";
import { localUploadDir } from "./lib/storage";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(helmet());
  // The web app normally calls the API through Next.js rewrites (same origin).
  // CORS is only for direct calls from WEB_URL (e.g. local tools).
  app.use(cors({ origin: process.env.WEB_URL ?? "http://localhost:3000", credentials: true }));
  // The Stripe webhook needs the raw body for its signature check, so it comes BEFORE express.json().
  app.use("/api/v1/stripe/webhook", stripeWebhookRouter);
  app.use(express.json({ limit: "1mb" }));
  // Secret enables signed cookies (guest cart id).
  app.use(cookieParser(env().JWT_SECRET));
  app.use(loadUser);

  const v1 = express.Router();
  v1.get("/health", (_req, res) => res.json({ ok: true }));
  v1.use("/auth", authRouter);
  v1.use("/admin/quotes", adminQuoteRouter);
  v1.use("/admin", adminRouter);
  v1.use("/cart", cartRouter);
  v1.use("/checkout", checkoutRouter);
  v1.use("/me", myOrdersRouter);
  v1.use("/quotes", quoteRouter);
  if (env().NODE_ENV !== "production") {
    // Photos saved without a Vercel Blob token (development only).
    v1.use("/uploads", express.static(localUploadDir(), { index: false, dotfiles: "deny", fallthrough: false }));
  }
  v1.use("/", catalogRouter);
  app.use("/api/v1", v1);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
