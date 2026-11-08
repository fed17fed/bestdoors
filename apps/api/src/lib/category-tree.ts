import { HttpError } from "./http-error";

/**
 * Rules for the 2-level category tree:
 * - a category cannot be its own parent
 * - the parent must be a main category (it has no parent itself)
 * - a category that already has subcategories must stay a main category
 */
export function assertValidParent(opts: {
  id?: string;
  parentId: string | null;
  parent: { id: string; parentId: string | null } | null;
  childCount: number;
}) {
  const { id, parentId, parent, childCount } = opts;
  if (!parentId) return;
  if (id && parentId === id) throw new HttpError(400, "A category cannot be its own parent");
  if (!parent) throw new HttpError(400, "Parent category not found");
  if (parent.parentId) throw new HttpError(400, "Only a main category can be a parent (max 2 levels)");
  if (childCount > 0) throw new HttpError(400, "This category has subcategories, so it must stay a main category");
}
