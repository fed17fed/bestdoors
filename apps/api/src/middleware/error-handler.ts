import type { ErrorRequestHandler, RequestHandler } from "express";
import { HttpError } from "../lib/http-error";

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ message: "Not found" });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message, errors: err.details });
  }
  // Prisma unique constraint
  if (err?.code === "P2002") return res.status(409).json({ message: "Already exists" });
  if (err?.code === "P2025") return res.status(404).json({ message: "Not found" });
  // Foreign key: e.g. a category that still has products
  if (err?.code === "P2003") return res.status(409).json({ message: "It is still in use, so it cannot be deleted" });
  if (err?.type === "entity.too.large") return res.status(413).json({ message: "The file is too large (max 4 MB)" });
  if (err?.type === "entity.parse.failed") return res.status(400).json({ message: "Invalid JSON" });
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
};
