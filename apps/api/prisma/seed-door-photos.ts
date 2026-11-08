/**
 * Adds door photos as product pictures and the "Front doors" category with one demo product.
 * Safe to repeat: only upserts / creates. It never deletes or changes existing images.
 * Run: npm run db:seed-door-photos  (uses DATABASE_URL)
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const D = "/images/doors/";
type Img = { file: string; alt: string };

// product slug -> photos (first one is the main picture). Alt texts come from public/images/doors/README.md
export const PHOTOS: Record<string, Img[]> = {
  "howth-sliding-patio-door": [
    { file: "category-sliding-door-aluminium-terrace.webp", alt: "Grey aluminium sliding glass wall on a terrace" },
    { file: "category-sliding-door-white-living-room.webp", alt: "White sliding patio door in a bright modern living room" },
  ],
  "slaney-black-industrial-door": [
    { file: "category-sliding-door-office-frosted-glass.webp", alt: "Black-frame glass door with frosted map pattern" },
  ],
  "atlantic-patio-door": [
    { file: "category-patio-sliding-door-house-patio.webp", alt: "White sliding patio door with grid bars on a house, patio with table and umbrella" },
    { file: "hero-patio-sliding-door-garden-view.webp", alt: "Large white sliding patio door and French doors in a bright room with garden view" },
  ],
  "burren-aluminium-patio-door": [
    { file: "category-exterior-glass-door-terrace-brick.webp", alt: "Aluminium glass door with one leaf open on a wooden terrace" },
    { file: "lifestyle-patio-door-woman-garden-view.webp", alt: "Woman with a mug at a dark-frame sliding patio door with garden view" },
  ],
  "kilkenny-french-door": [
    { file: "category-french-door-white-garden-view.webp", alt: "White French doors with glazing bars open to a garden" },
    { file: "category-french-door-blue-glazed.webp", alt: "Blue French double door with glazing bars, seen from inside" },
  ],
  "waterford-upvc-french-door": [
    { file: "category-exterior-french-door-brick-house.webp", alt: "White French door in a red brick house" },
  ],
  "donegal-interior-french-door": [
    { file: "interior-scene-conservatory-glazed-door.webp", alt: "Sunroom with a white glazed door and dining table" },
  ],
  "navy-composite-front-door": [
    { file: "product-front-door-navy-round-glass.webp", alt: "Navy blue composite front door with round window and two side panels" },
  ],
};

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  // 1. Category "Front doors" (type EXTERIOR: no schema change needed)
  const count = await prisma.category.count();
  const category = await prisma.category.upsert({
    where: { slug: "front-doors" },
    update: {},
    create: { slug: "front-doors", type: "EXTERIOR", sortOrder: count },
  });
  await prisma.categoryTranslation.upsert({
    where: { categoryId_locale: { categoryId: category.id, locale: "en" } },
    update: {},
    create: {
      categoryId: category.id,
      locale: "en",
      name: "Front Doors",
      description: "Composite and timber front doors for a strong first impression.",
    },
  });

  // 2. Demo product (styled like the existing exterior products)
  const slug = "navy-composite-front-door";
  const existing = await prisma.product.findUnique({ where: { slug } });
  const product =
    existing ??
    (await prisma.product.create({
      data: { slug, categoryId: category.id, material: "Composite", basePrice: 1390, featured: false, published: true },
    }));
  await prisma.productTranslation.upsert({
    where: { productId_locale: { productId: product.id, locale: "en" } },
    update: {},
    create: {
      productId: product.id,
      locale: "en",
      name: "Navy Composite Front Door",
      description: "A strong, well-insulated navy composite front door with a round glass window and a multi-point lock.",
    },
  });
  const groups = await prisma.optionGroup.findMany({ where: { code: { in: ["size", "colour", "glass", "handle", "swing"] } } });
  await prisma.productOptionGroup.createMany({
    data: groups.map((g) => ({ productId: product.id, optionGroupId: g.id })),
    skipDuplicates: true,
  });

  // 3. Photos (add only the missing ones)
  let added = 0;
  const missing: string[] = [];
  for (const [productSlug, imgs] of Object.entries(PHOTOS)) {
    const p = await prisma.product.findUnique({ where: { slug: productSlug }, include: { images: true } });
    if (!p) {
      missing.push(productSlug);
      continue;
    }
    for (const [i, img] of imgs.entries()) {
      const url = D + img.file;
      if (p.images.some((x) => x.url === url)) continue;
      await prisma.productImage.create({ data: { productId: p.id, url, alt: img.alt, sortOrder: p.images.length + i } });
      added++;
    }
  }
  console.log(`Front doors category ready, product ${existing ? "existed" : "created"}, ${added} photos added.`);
  if (missing.length) console.warn(`Products not found (skipped): ${missing.join(", ")}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
