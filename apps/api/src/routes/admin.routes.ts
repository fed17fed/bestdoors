import { Router } from "express";
import express from "express";
import { z } from "zod";
import { categoryInputSchema, optionGroupInputSchema, orderStatusSchema, productInputSchema } from "@bestdoors/shared";
import { HttpError } from "../lib/http-error";
import { MAX_PHOTO_BYTES, PHOTO_TYPES, savePhoto } from "../lib/storage";
import { orderService } from "../services/order.service";
import { requireAdmin } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { adminService } from "../services/admin.service";
import { parseListParams, sendList } from "./react-admin";

export const adminRouter = Router();
adminRouter.use(requireAdmin);

// ----- products -----
adminRouter.get("/products", async (req, res) => {
  const params = parseListParams(req);
  const { data, total } = await adminService.listProducts(params);
  sendList(res, "products", data, total, params.page, params.perPage);
});
adminRouter.get("/products/:id", async (req, res) => {
  res.json(await adminService.getProduct(String(String(req.params.id))));
});
adminRouter.post("/products", validateBody(productInputSchema), async (_req, res) => {
  res.status(201).json(await adminService.createProduct(res.locals.body));
});
adminRouter.put("/products/:id", validateBody(productInputSchema), async (req, res) => {
  res.json(await adminService.updateProduct(String(String(req.params.id)), res.locals.body));
});
adminRouter.delete("/products/:id", async (req, res) => {
  res.json(await adminService.deleteProduct(String(String(req.params.id))));
});

// ----- categories -----
adminRouter.get("/categories", async (_req, res) => {
  const data = await adminService.listCategories();
  sendList(res, "categories", data, data.length);
});
adminRouter.get("/categories/:id", async (req, res) => {
  res.json(await adminService.getCategory(String(String(req.params.id))));
});
adminRouter.post("/categories", validateBody(categoryInputSchema), async (_req, res) => {
  res.status(201).json(await adminService.createCategory(res.locals.body));
});
adminRouter.put("/categories/:id", validateBody(categoryInputSchema), async (req, res) => {
  res.json(await adminService.updateCategory(String(String(req.params.id)), res.locals.body));
});
adminRouter.delete("/categories/:id", async (req, res) => {
  res.json(await adminService.deleteCategory(String(String(req.params.id))));
});

// ----- option groups (edit names, values and prices; groups themselves are fixed) -----
adminRouter.get("/option-groups", async (_req, res) => {
  const data = await adminService.listOptionGroups();
  sendList(res, "option-groups", data, data.length);
});
adminRouter.get("/option-groups/:id", async (req, res) => {
  res.json(await adminService.getOptionGroup(String(req.params.id)));
});
adminRouter.put("/option-groups/:id", validateBody(optionGroupInputSchema), async (req, res) => {
  res.json(await adminService.updateOptionGroup(String(req.params.id), res.locals.body));
});

// ----- orders -----
function statusFilter(raw: unknown) {
  try {
    const parsed = orderStatusSchema.safeParse(JSON.parse(String(raw ?? "{}"))?.status);
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
}
adminRouter.get("/orders", async (req, res) => {
  const params = parseListParams(req);
  const { data, total } = await orderService.adminList({ ...params, status: statusFilter(req.query.filter) });
  sendList(res, "orders", data, total, params.page, params.perPage);
});
adminRouter.get("/orders/:id", async (req, res) => {
  res.json(await orderService.adminGet(String(req.params.id)));
});
adminRouter.put("/orders/:id", validateBody(z.object({ status: orderStatusSchema })), async (req, res) => {
  res.json(await orderService.adminSetStatus(String(req.params.id), res.locals.body.status));
});

// ----- product image upload (one image per request) -----
adminRouter.post("/uploads", express.raw({ type: PHOTO_TYPES, limit: MAX_PHOTO_BYTES }), async (req, res) => {
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
    throw new HttpError(415, "Send one JPG, PNG or WebP image as the request body");
  }
  res.status(201).json({ url: await savePhoto("products", req.body) });
});
