import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { seedPages } from "./seed-pages";
import { CATEGORY_TREE, PRODUCT_MOVES } from "./category-tree-data";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

type T = { en: string };

type Opt = { code: string; label: T; delta: number; swatch?: string; isDefault?: boolean };
const optionGroups: { code: string; name: T; values: Opt[] }[] = [
  {
    code: "size",
    name: { en: "Size" },
    values: [
      { code: "762x1981", label: { en: "762 × 1981 mm (standard)" }, delta: 0, isDefault: true },
      { code: "838x1981", label: { en: "838 × 1981 mm" }, delta: 60 },
      { code: "914x2032", label: { en: "914 × 2032 mm (wide)" }, delta: 140 },
    ],
  },
  {
    code: "colour",
    name: { en: "Colour" },
    values: [
      { code: "white", label: { en: "White" }, delta: 0, swatch: "#f5f5f2", isDefault: true },
      { code: "anthracite", label: { en: "Anthracite Grey" }, delta: 90, swatch: "#383e42" },
      { code: "oak", label: { en: "Golden Oak" }, delta: 120, swatch: "#b5803f" },
      { code: "green", label: { en: "Irish Green" }, delta: 90, swatch: "#1f5c3a" },
      { code: "black", label: { en: "Black" }, delta: 90, swatch: "#151515" },
    ],
  },
  {
    code: "glass",
    name: { en: "Glass" },
    values: [
      { code: "none", label: { en: "No glass" }, delta: 0, isDefault: true },
      { code: "frosted", label: { en: "Frosted glass" }, delta: 110 },
      { code: "clear", label: { en: "Clear double glazing" }, delta: 150 },
    ],
  },
  {
    code: "handle",
    name: { en: "Handle" },
    values: [
      { code: "chrome", label: { en: "Chrome lever" }, delta: 0, isDefault: true },
      { code: "black-bar", label: { en: "Black bar handle" }, delta: 45 },
      { code: "brass", label: { en: "Brass knob" }, delta: 35 },
    ],
  },
  {
    code: "swing",
    name: { en: "Opening side" },
    values: [
      { code: "left", label: { en: "Left" }, delta: 0, isDefault: true },
      { code: "right", label: { en: "Right" }, delta: 0 },
    ],
  },
];

// [slug, category, material, price, featured, name, description, option codes]
type P = [string, string, string, number, boolean, T, T, string[]];
const all = ["size", "colour", "glass", "handle", "swing"];
const products: P[] = [
  ["dublin-composite-front-door", "exterior-doors", "Composite", 1290, true, { en: "Dublin Composite Front Door" }, { en: "A strong, well-insulated composite door with a multi-point lock." }, all],
  ["galway-aluminium-front-door", "exterior-doors", "Aluminium", 1890, true, { en: "Galway Aluminium Front Door" }, { en: "Slim modern aluminium door with a flush finish." }, all],
  ["kerry-oak-front-door", "exterior-doors", "Timber", 1650, false, { en: "Kerry Oak Front Door" }, { en: "Solid oak entrance door with a traditional look." }, all],
  ["cork-steel-security-door", "exterior-doors", "Steel", 1450, false, { en: "Cork Steel Security Door" }, { en: "Steel security door with reinforced frame." }, ["size", "colour", "handle", "swing"]],
  ["wicklow-cottage-door", "exterior-doors", "Composite", 1150, false, { en: "Wicklow Cottage Door" }, { en: "Cottage-style composite door with a small glass panel." }, all],
  ["liffey-white-panel-door", "interior-doors", "MDF", 189, true, { en: "Liffey White Panel Door" }, { en: "Clean white four-panel interior door." }, ["size", "glass", "handle", "swing"]],
  ["shannon-oak-interior-door", "interior-doors", "Oak veneer", 289, true, { en: "Shannon Oak Interior Door" }, { en: "Warm oak veneer door with a modern line design." }, ["size", "glass", "handle", "swing"]],
  ["boyne-grey-flush-door", "interior-doors", "MDF", 219, false, { en: "Boyne Grey Flush Door" }, { en: "Smooth flush door in a soft grey finish." }, ["size", "colour", "handle", "swing"]],
  ["barrow-glazed-interior-door", "interior-doors", "Pine", 259, false, { en: "Barrow Glazed Interior Door" }, { en: "Pine door with full-height frosted glass." }, ["size", "handle", "swing"]],
  ["slaney-black-industrial-door", "interior-doors", "Steel & glass", 549, true, { en: "Slaney Black Industrial Door" }, { en: "Black framed glass door in industrial style." }, ["size", "glass", "handle", "swing"]],
  ["moy-cottage-interior-door", "interior-doors", "Pine", 199, false, { en: "Moy Cottage Interior Door" }, { en: "Simple ledged pine door for a cottage feel." }, ["size", "handle", "swing"]],
  ["atlantic-patio-door", "patio-doors", "uPVC", 1490, true, { en: "Atlantic Patio Door" }, { en: "Energy-efficient uPVC patio door with wide glass." }, ["size", "colour", "handle", "swing"]],
  ["burren-aluminium-patio-door", "patio-doors", "Aluminium", 2290, false, { en: "Burren Aluminium Patio Door" }, { en: "Slim aluminium frame for maximum light." }, ["size", "colour", "handle", "swing"]],
  ["connemara-bifold-door", "patio-doors", "Aluminium", 3490, false, { en: "Connemara Bi-fold Door" }, { en: "Three-panel bi-fold door that opens your room to the garden." }, ["size", "colour"]],
  ["howth-sliding-patio-door", "sliding-doors", "Aluminium", 1990, true, { en: "Howth Sliding Patio Door" }, { en: "Large sliding glass door with a smooth rail." }, ["size", "colour", "handle"]],
  ["clare-pocket-door", "sliding-doors", "Oak veneer", 449, false, { en: "Clare Pocket Door" }, { en: "Pocket sliding door that hides inside the wall." }, ["size", "glass", "handle"]],
  ["sligo-barn-door", "sliding-doors", "Timber", 499, false, { en: "Sligo Barn Door" }, { en: "Rustic sliding barn door with black hardware." }, ["size", "colour"]],
  ["kilkenny-french-door", "french-doors", "Timber", 1390, true, { en: "Kilkenny French Doors" }, { en: "Classic timber French doors with Georgian bars." }, all],
  ["waterford-upvc-french-door", "french-doors", "uPVC", 1190, false, { en: "Waterford uPVC French Doors" }, { en: "Low-maintenance uPVC French doors." }, ["size", "colour", "handle", "swing"]],
  ["donegal-interior-french-door", "french-doors", "Pine", 590, false, { en: "Donegal Interior French Doors" }, { en: "Glazed double doors between living and dining rooms." }, ["size", "glass", "handle"]],
];

async function main() {
  // Categories (2-level tree: main categories first, so parents exist)
  const categoryIds: Record<string, string> = {};
  for (const c of [...CATEGORY_TREE].sort((a, b) => Number(a.parent !== null) - Number(b.parent !== null))) {
    const parentId = c.parent ? categoryIds[c.parent]! : null;
    const row = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { type: c.type, sortOrder: c.sortOrder, parentId },
      create: { slug: c.slug, type: c.type, sortOrder: c.sortOrder, parentId },
    });
    categoryIds[c.slug] = row.id;
    await prisma.categoryTranslation.upsert({
      where: { categoryId_locale: { categoryId: row.id, locale: "en" } },
      update: { name: c.name, description: c.description },
      create: { categoryId: row.id, locale: "en", name: c.name, description: c.description },
    });
  }

  // Option groups and values
  const groupIds: Record<string, string> = {};
  for (const [i, g] of optionGroups.entries()) {
    const group = await prisma.optionGroup.upsert({
      where: { code: g.code },
      update: { sortOrder: i },
      create: { code: g.code, sortOrder: i },
    });
    groupIds[g.code] = group.id;
    for (const locale of ["en"] as const) {
      await prisma.optionGroupTranslation.upsert({
        where: { optionGroupId_locale: { optionGroupId: group.id, locale } },
        update: { name: g.name[locale] },
        create: { optionGroupId: group.id, locale, name: g.name[locale] },
      });
    }
    for (const [j, v] of g.values.entries()) {
      const data = { priceDelta: v.delta, swatch: v.swatch ?? "", sortOrder: j, isDefault: v.isDefault ?? false };
      const value = await prisma.optionValue.upsert({
        where: { optionGroupId_code: { optionGroupId: group.id, code: v.code } },
        update: data,
        create: { optionGroupId: group.id, code: v.code, ...data },
      });
      for (const locale of ["en"] as const) {
        await prisma.optionValueTranslation.upsert({
          where: { optionValueId_locale: { optionValueId: value.id, locale } },
          update: { label: v.label[locale] },
          create: { optionValueId: value.id, locale, label: v.label[locale] },
        });
      }
    }
  }

  // Products
  for (const [slug, cat, material, price, featured, name, description, opts] of products) {
    const data = { categoryId: categoryIds[PRODUCT_MOVES[slug] ?? cat]!, material, basePrice: price, featured, published: true };
    const product = await prisma.product.upsert({ where: { slug }, update: data, create: { slug, ...data } });
    for (const locale of ["en"] as const) {
      await prisma.productTranslation.upsert({
        where: { productId_locale: { productId: product.id, locale } },
        update: { name: name[locale], description: description[locale] },
        create: { productId: product.id, locale, name: name[locale], description: description[locale] },
      });
    }
    await prisma.productOptionGroup.deleteMany({ where: { productId: product.id } });
    await prisma.productOptionGroup.createMany({
      data: opts.map((code) => ({ productId: product.id, optionGroupId: groupIds[code]! })),
    });
  }

  // Admin user
  const email = process.env.ADMIN_EMAIL ?? "admin@bestdoors.ie";
  const password = process.env.ADMIN_PASSWORD;
  if (password) {
    await prisma.user.upsert({
      where: { email },
      update: { role: "ADMIN" },
      create: { email, name: "BestDoors Admin", role: "ADMIN", passwordHash: await bcrypt.hash(password, 12) },
    });
  } else {
    console.warn("ADMIN_PASSWORD is not set: admin user was not created.");
  }

  // Info pages (only the missing ones are created)
  const newPages = await seedPages(prisma);

  console.log(`Seeded ${CATEGORY_TREE.length} categories, ${optionGroups.length} option groups, ${products.length} products, ${newPages} new info pages.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
