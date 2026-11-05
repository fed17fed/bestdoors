import Stripe from "stripe";
import { env } from "./env";
import { HttpError } from "./http-error";

let client: Stripe | undefined;

/** Lazy Stripe client (created on first use, so a missing key does not break start-up). */
export function stripe(): Stripe {
  if (client) return client;
  const key = env().STRIPE_SECRET_KEY;
  if (!key) throw new HttpError(503, "Payments are not configured");
  client = new Stripe(key, { appInfo: { name: "BestDoors" } });
  return client;
}

/** Tests replace the client with a mocked one. */
export function setStripeClient(next: Stripe | undefined) {
  client = next;
}

export function webhookSecret(): string {
  const secret = env().STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new HttpError(503, "Stripe webhook is not configured");
  return secret;
}

/** Euros (2 decimals) → cents for Stripe. */
export const toCents = (eur: number) => Math.round(eur * 100);
