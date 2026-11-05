import { z } from "zod";
import { LOCALES } from "./locales";
import { CATEGORY_TYPES, ORDER_STATUSES, QUOTE_STATUSES } from "./enums";

const slug = z
  .string()
  .trim()
  .min(2)
  .max(180)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes");

export const localeSchema = z.enum(LOCALES);

export const translationSchema = z.object({
  locale: localeSchema,
  name: z.string().trim().min(2).max(160),
  description: z.string().max(5000).default(""),
});

/** At least the English translation is required. */
const translations = z
  .array(translationSchema)
  .min(1)
  .refine((list) => list.some((t) => t.locale === "en"), "English translation is required")
  .refine((list) => new Set(list.map((t) => t.locale)).size === list.length, "Duplicate locale");

export const categoryInputSchema = z.object({
  slug,
  type: z.enum(CATEGORY_TYPES),
  imageUrl: z.string().url().or(z.literal("")).default(""),
  sortOrder: z.number().int().default(0),
  translations,
});
export type CategoryInput = z.infer<typeof categoryInputSchema>;

export const productInputSchema = z.object({
  slug,
  categoryId: z.string().min(1),
  material: z.string().trim().min(2).max(80),
  basePrice: z.coerce.number().finite().nonnegative().max(1_000_000),
  published: z.boolean().default(false),
  featured: z.boolean().default(false),
  translations,
  images: z
    .array(z.object({ url: z.string().url(), alt: z.string().max(200).default("") }))
    .default([]),
  optionGroupIds: z.array(z.string()).default([]),
});
export type ProductInput = z.infer<typeof productInputSchema>;

export const productListQuerySchema = z.object({
  locale: localeSchema.default("en"),
  category: z.string().optional(),
  material: z.string().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  q: z.string().trim().max(100).optional(),
  sort: z.enum(["price-asc", "price-desc", "newest", "name"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(60).default(12),
});
export type ProductListQuery = z.infer<typeof productListQuerySchema>;

/** Configurator selection: optionGroupId -> optionValueId */
export const selectionSchema = z.record(z.string(), z.string());
export type Selection = z.infer<typeof selectionSchema>;

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(200),
  name: z.string().trim().min(2).max(120),
  locale: localeSchema.default("en"),
});
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(200),
});

/** Irish Eircode, e.g. "D02 X285" or "D6W 1234". */
export const EIRCODE_REGEX = /^([AC-FHKNPRTV-Y]\d{2}|D6W) ?[0-9AC-FHKNPRTV-Y]{4}$/i;
export const MAX_QUOTE_PHOTOS = 5;

export const quoteInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email(),
  phone: z.string().trim().max(40).default(""),
  doorType: z.enum(CATEGORY_TYPES),
  widthMm: z.coerce.number().int().min(300).max(5000).optional(),
  heightMm: z.coerce.number().int().min(300).max(5000).optional(),
  eircode: z
    .string()
    .trim()
    .max(10)
    .refine((v) => v === "" || EIRCODE_REGEX.test(v), "Invalid Eircode")
    .transform((v) => (v ? `${v.replace(/ /g, "").slice(0, 3)} ${v.replace(/ /g, "").slice(3)}`.toUpperCase() : ""))
    .default(""),
  message: z.string().trim().max(5000).default(""),
  photos: z.array(z.string().url().max(500)).max(MAX_QUOTE_PHOTOS).default([]),
  productId: z.string().max(40).optional(),
  locale: localeSchema.default("en"),
  /** Honeypot: hidden in the form. People leave it empty, spam bots fill it. */
  website: z.string().max(200).optional(),
});
export type QuoteInput = z.infer<typeof quoteInputSchema>;

export const orderStatusSchema = z.enum(ORDER_STATUSES);
export const quoteStatusSchema = z.enum(QUOTE_STATUSES);

const optionGroupTranslations = z
  .array(z.object({ locale: localeSchema, name: z.string().trim().min(1).max(80) }))
  .min(1)
  .refine((list) => list.some((t) => t.locale === "en"), "English translation is required")
  .refine((list) => new Set(list.map((t) => t.locale)).size === list.length, "Duplicate locale");

const optionValueTranslations = z
  .array(z.object({ locale: localeSchema, label: z.string().trim().min(1).max(80) }))
  .min(1)
  .refine((list) => list.some((t) => t.locale === "en"), "English translation is required")
  .refine((list) => new Set(list.map((t) => t.locale)).size === list.length, "Duplicate locale");

/** Admin: edit an option group (e.g. "Colour") and its values with prices. */
export const optionGroupInputSchema = z.object({
  sortOrder: z.coerce.number().int().min(0).max(1000).default(0),
  translations: optionGroupTranslations,
  values: z
    .array(
      z.object({
        id: z.string().max(40).optional(),
        code: z
          .string()
          .trim()
          .min(1)
          .max(60)
          .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes"),
        priceDelta: z.coerce.number().finite().min(-100_000).max(100_000).default(0),
        swatch: z
          .string()
          .trim()
          .regex(/^(#[0-9a-fA-F]{6})?$/, "Use a colour like #1f4d3a, or leave it empty")
          .default(""),
        isDefault: z.boolean().default(false),
        translations: optionValueTranslations,
      }),
    )
    .min(1, "Add at least one value")
    .max(100)
    .refine((list) => new Set(list.map((v) => v.code)).size === list.length, "Each value needs a different code")
    .refine((list) => list.filter((v) => v.isDefault).length <= 1, "Only one value can be the default"),
});
export type OptionGroupInput = z.infer<typeof optionGroupInputSchema>;
