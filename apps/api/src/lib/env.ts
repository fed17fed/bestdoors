import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is not set"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  WEB_URL: z.string().url().default("http://localhost:3000"),
  // Payments and emails are optional at start-up: the shop still works without them,
  // and the routes that need them answer 503.
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  // Resend only sends from a verified domain. Until bestdoors.ie is verified,
  // "onboarding@resend.dev" works, but only to the Resend account owner's email.
  EMAIL_FROM: z.string().default("BestDoors <onboarding@resend.dev>"),
  // Vercel Blob for quote photos. Without it, photos go to a local folder (development only).
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  // The shop owner's email: gets new quote requests and a copy of every order email.
  SHOP_EMAIL: z.string().email().optional().or(z.literal("")),
});

let cached: z.infer<typeof envSchema> | undefined;

/** Validated env, read lazily so tests can set process.env first. */
export function env() {
  cached ??= envSchema.parse(process.env);
  return cached;
}
