import { Router } from "express";
import { productListQuerySchema, selectionSchema } from "@bestdoors/shared";
import { z } from "zod";
import { catalogService } from "../services/catalog.service";
import { requestLocale } from "../lib/locale";
import { HttpError } from "../lib/http-error";

export const catalogRouter = Router();

catalogRouter.get("/categories", async (req, res) => {
  res.json(await catalogService.listCategories(requestLocale(req)));
});

catalogRouter.get("/products", async (req, res) => {
  const parsed = productListQuerySchema.safeParse({ ...req.query, locale: requestLocale(req) });
  if (!parsed.success) throw new HttpError(400, "Invalid query", parsed.error.flatten());
  res.json(await catalogService.listProducts(parsed.data));
});

catalogRouter.get("/products/:slug", async (req, res) => {
  res.json(await catalogService.getProductBySlug(req.params.slug, requestLocale(req)));
});

const priceBody = z.object({ selection: selectionSchema.default({}) });

catalogRouter.post("/products/:id/price", async (req, res) => {
  const parsed = priceBody.safeParse(req.body ?? {});
  if (!parsed.success) throw new HttpError(400, "Invalid selection", parsed.error.flatten());
  res.json(await catalogService.priceProduct(req.params.id, parsed.data.selection, requestLocale(req)));
});
