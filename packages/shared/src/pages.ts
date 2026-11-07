import { z } from "zod";
import { PAGE_STATUSES } from "./enums";

/** Pages the shop itself links to (footer, cookie notice, emails). They cannot be deleted or renamed. */
export const CORE_PAGE_SLUGS = ["privacy", "terms"] as const;

/** Addresses the shop already uses: a page with one of these slugs would never be reached. */
export const RESERVED_PAGE_SLUGS = [
  "admin", "api", "doors", "cart", "quote", "checkout", "sitemap", "robots", "icon", "images",
  "en", "uk", "login", "account", "orders", "search",
] as const;

export const PAGE_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const pageSlugSchema = z
  .string()
  .trim()
  .min(2, "Use at least 2 characters")
  .max(80)
  .regex(PAGE_SLUG_REGEX, "Use lowercase letters, numbers and dashes (e.g. about-us)")
  .refine((v) => !(RESERVED_PAGE_SLUGS as readonly string[]).includes(v), "This address is used by the shop. Choose another one");

export const pageStatusSchema = z.enum(PAGE_STATUSES);

/** Admin: create or edit an info page. `content` is HTML; the API cleans it before saving. */
export const pageInputSchema = z.object({
  slug: pageSlugSchema,
  title: z.string().trim().min(2, "Title is required").max(160),
  content: z.string().max(200_000, "The text is too long").default(""),
  seoTitle: z.string().trim().max(120).default(""),
  seoDescription: z.string().trim().max(320).default(""),
  status: pageStatusSchema.default("DRAFT"),
  showInFooter: z.boolean().default(false),
  sortOrder: z.coerce.number().int().min(0).max(10_000).default(0),
});
export type PageInput = z.infer<typeof pageInputSchema>;
