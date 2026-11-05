export const CATEGORY_TYPES = ["INTERIOR", "EXTERIOR", "PATIO", "SLIDING", "FRENCH"] as const;
export type CategoryType = (typeof CATEGORY_TYPES)[number];

export const ORDER_STATUSES = [
  "PENDING",
  "PAID",
  "IN_PRODUCTION",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const QUOTE_STATUSES = ["NEW", "IN_PROGRESS", "SENT", "ACCEPTED", "REJECTED"] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];
