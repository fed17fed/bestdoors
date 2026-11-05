import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { HttpError } from "../lib/http-error";

/** Parses req.body with a Zod schema and stores the result in res.locals.body. */
export const validateBody =
  (schema: ZodType): RequestHandler =>
  (req, res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return next(new HttpError(400, "Invalid data", parsed.error.flatten()));
    res.locals.body = parsed.data;
    next();
  };
