import type { Category } from "./types";

export type CategoryNode = Category & { children: Category[] };

/** Main categories (no parent) with their subcategories. Keeps the order from the API. */
export function buildCategoryTree(categories: Category[]): CategoryNode[] {
  return categories
    .filter((c) => !c.parentId)
    .map((main) => ({ ...main, children: categories.filter((c) => c.parentId === main.id) }));
}

/** The main category of a subcategory, or undefined for a main category. */
export function parentOf(category: Category, categories: Category[]): Category | undefined {
  return category.parentId ? categories.find((c) => c.id === category.parentId) : undefined;
}
