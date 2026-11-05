import express, { Router } from "express";
import { quoteInputSchema, quoteStatusSchema } from "@bestdoors/shared";
import { z } from "zod";
import { HttpError } from "../lib/http-error";
import { MAX_PHOTO_BYTES, PHOTO_TYPES, savePhoto } from "../lib/storage";
import { requireAdmin } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { quoteService } from "../services/quote.service";
import { parseListParams, sendList } from "./react-admin";

/** Public: POST /quotes/photos (one photo per request), POST /quotes. */
export const quoteRouter = Router();

quoteRouter.post(
  "/photos",
  express.raw({ type: PHOTO_TYPES, limit: MAX_PHOTO_BYTES }),
  async (req, res) => {
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      throw new HttpError(415, "Send one JPG, PNG or WebP photo as the request body");
    }
    res.status(201).json({ url: await savePhoto("quotes", req.body) });
  },
);

quoteRouter.post("/", validateBody(quoteInputSchema), async (_req, res) => {
  const input = res.locals.body as z.infer<typeof quoteInputSchema>;
  if (input.website) {
    // Honeypot filled in: most likely a bot. Answer like a success, save nothing.
    res.status(201).json({ id: "", reference: "Q-000000" });
    return;
  }
  res.status(201).json(await quoteService.create(input));
});

/** Admin: GET /admin/quotes, GET /admin/quotes/:id, PUT /admin/quotes/:id (status). */
export const adminQuoteRouter = Router();
adminQuoteRouter.use(requireAdmin);

adminQuoteRouter.get("/", async (req, res) => {
  const params = parseListParams(req);
  let status: z.infer<typeof quoteStatusSchema> | undefined;
  try {
    const filter = JSON.parse(String(req.query.filter ?? "{}"));
    const parsed = quoteStatusSchema.safeParse(filter?.status);
    if (parsed.success) status = parsed.data;
  } catch {
    // no status filter
  }
  const { data, total } = await quoteService.list({ ...params, status });
  sendList(res, "quotes", data, total, params.page, params.perPage);
});

adminQuoteRouter.get("/:id", async (req, res) => {
  res.json(await quoteService.get(String(req.params.id)));
});

adminQuoteRouter.put("/:id", validateBody(z.object({ status: quoteStatusSchema })), async (req, res) => {
  res.json(await quoteService.setStatus(String(req.params.id), res.locals.body.status));
});
