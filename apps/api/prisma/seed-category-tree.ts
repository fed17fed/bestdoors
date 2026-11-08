/**
 * Builds the 2-level category tree (Exterior Doors / Interior Doors + subcategories).
 * Safe to repeat: only upserts / updates. It never deletes anything.
 * - existing categories: only parentId, type and sortOrder are set (names and texts are NOT changed),
 *   except the names in CATEGORY_RENAMES (explicit English name update, idempotent)
 * - new categories: created with an English name and description
 * - 3 products are moved to the new interior subcategories (categoryId update)
 * Run: npm run db:seed-category-tree  (uses DATABASE_URL)
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { CATEGORY_TREE, PRODUCT_MOVES, CATEGORY_RENAMES } from "./category-tree-data";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const ids: Record<string, string> = {};
  let created = 0;

  // Pass 1: main categories first, then the others.
  for (const c of [...CATEGORY_TREE].sort((a, b) => Number(a.parent !== null) - Number(b.parent !== null))) {
    const parentId = c.parent ? ids[c.parent] : null;
    if (c.parent && !parentId) throw new Error(`Parent ${c.parent} missing for ${c.slug}`);
    const existing = await prisma.category.findUnique({ where: { slug: c.slug } });
    const row = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { parentId, type: c.type, sortOrder: c.sortOrder },
      create: { slug: c.slug, type: c.type, parentId, sortOrder: c.sortOrder },
    });
    if (!existing) created++;
    ids[c.slug] = row.id;
    await prisma.categoryTranslation.upsert({
      where: { categoryId_locale: { categoryId: row.id, locale: "en" } },
      update: {},
      create: { categoryId: row.id, locale: "en", name: c.name, description: c.description },
    });
  }

  // Explicit rename of exactly these categories (slug stays the same).
  let renamed = 0;
  for (const [slug, name] of Object.entries(CATEGORY_RENAMES)) {
    if (!ids[slug]) continue;
    const res = await prisma.categoryTranslation.updateMany({
      where: { categoryId: ids[slug], locale: "en", NOT: { name } },
      data: { name },
    });
    renamed += res.count;
  }

  // Pass 2: move products (only if they exist and are not there yet).
  let moved = 0;
  for (const [productSlug, categorySlug] of Object.entries(PRODUCT_MOVES)) {
    const res = await prisma.product.updateMany({
      where: { slug: productSlug, NOT: { categoryId: ids[categorySlug] } },
      data: { categoryId: ids[categorySlug]! },
    });
    moved += res.count;
  }
  console.log(`Category tree ready: ${created} categories created, ${moved} products moved, ${renamed} categories renamed.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
