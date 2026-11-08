import type { CategoryType } from "../src/generated/prisma/client";

/** Two-level category tree: two main categories (parent = null) and their subcategories. */
export type TreeCategory = {
  slug: string;
  type: CategoryType;
  parent: string | null;
  sortOrder: number;
  name: string;
  description: string;
};

export const CATEGORY_TREE: TreeCategory[] = [
  { slug: "exterior-doors", type: "EXTERIOR", parent: null, sortOrder: 0, name: "Exterior Doors", description: "Secure, insulated front doors built for the Irish weather." },
  { slug: "interior-doors", type: "INTERIOR", parent: null, sortOrder: 1, name: "Interior Doors", description: "Modern interior doors for every room in your home." },
  { slug: "front-doors", type: "EXTERIOR", parent: "exterior-doors", sortOrder: 2, name: "Front Doors", description: "Composite and timber front doors for a strong first impression." },
  { slug: "patio-doors", type: "PATIO", parent: "exterior-doors", sortOrder: 3, name: "Patio Doors", description: "Bring more light into your home with patio doors." },
  { slug: "sliding-doors", type: "SLIDING", parent: "exterior-doors", sortOrder: 4, name: "Exterior Sliding Doors", description: "Space-saving sliding doors with a smooth, quiet action." },
  { slug: "french-doors", type: "FRENCH", parent: "exterior-doors", sortOrder: 5, name: "Exterior French Doors", description: "Classic double doors with glass panels." },
  { slug: "interior-sliding-doors", type: "SLIDING", parent: "interior-doors", sortOrder: 6, name: "Interior Sliding Doors", description: "Pocket and barn sliding doors that save space indoors." },
  { slug: "interior-french-doors", type: "FRENCH", parent: "interior-doors", sortOrder: 7, name: "Interior French Doors", description: "Glazed double doors between living and dining rooms." },
];

/** Products that move to a new subcategory. */
export const PRODUCT_MOVES: Record<string, string> = {
  "clare-pocket-door": "interior-sliding-doors",
  "sligo-barn-door": "interior-sliding-doors",
  "donegal-interior-french-door": "interior-french-doors",
};

/** Explicit English display-name updates for existing categories (slugs/URLs do not change). */
export const CATEGORY_RENAMES: Record<string, string> = {
  "sliding-doors": "Exterior Sliding Doors",
  "french-doors": "Exterior French Doors",
  "front-doors": "Front Doors",
};
