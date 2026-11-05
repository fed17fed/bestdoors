import type { Request, Response } from "express";

/** Reads React Admin list params (page/perPage/sort/order/filter), like door-store did. */
export function parseListParams(req: Request) {
  const page = Math.max(1, Number(req.query.page ?? 1) || 1);
  const perPage = Math.min(100, Math.max(1, Number(req.query.perPage ?? 10) || 10));
  const sort = String(req.query.sort ?? "createdAt");
  const order: "asc" | "desc" = req.query.order === "ASC" ? "asc" : "desc";
  const rawFilter = String(req.query.filter ?? "");
  let search = rawFilter;
  try {
    const parsed = JSON.parse(rawFilter);
    search = typeof parsed === "string" ? parsed : String(parsed.q ?? "");
  } catch {
    // plain string search is fine
  }
  return { page, perPage, sort, order, search };
}

/** React Admin reads the total from the Content-Range header. */
export function sendList(res: Response, resource: string, data: unknown[], total: number, page = 1, perPage = data.length) {
  const start = (page - 1) * perPage;
  const end = Math.max(start, start + data.length - 1);
  res.setHeader("Content-Range", `${resource} ${start}-${end}/${total}`);
  res.setHeader("Access-Control-Expose-Headers", "Content-Range");
  res.json(data);
}
