import { Router } from "express";
import { PAGE_SLUG_REGEX } from "@bestdoors/shared";
import { pageService } from "../services/page.service";
import { HttpError } from "../lib/http-error";

/** Public: published pages only. */
export const pageRouter = Router();

pageRouter.get("/", async (_req, res) => {
  res.json(await pageService.listPublished());
});

pageRouter.get("/:slug", async (req, res) => {
  const slug = String(req.params.slug);
  if (slug.length > 80 || !PAGE_SLUG_REGEX.test(slug)) throw new HttpError(404, "Page not found");
  res.json(await pageService.getPublished(slug));
});
