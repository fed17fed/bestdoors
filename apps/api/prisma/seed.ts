import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type CategoryType } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

type T = { en: string; uk: string };

const categories: { slug: string; type: CategoryType; name: T; description: T }[] = [
  {
    slug: "exterior-doors",
    type: "EXTERIOR",
    name: { en: "Exterior Doors", uk: "Вхідні двері" },
    description: {
      en: "Secure, insulated front doors built for the Irish weather.",
      uk: "Надійні утеплені вхідні двері, створені для ірландської погоди.",
    },
  },
  {
    slug: "interior-doors",
    type: "INTERIOR",
    name: { en: "Interior Doors", uk: "Міжкімнатні двері" },
    description: {
      en: "Modern interior doors for every room in your home.",
      uk: "Сучасні міжкімнатні двері для кожної кімнати вашого дому.",
    },
  },
  {
    slug: "patio-doors",
    type: "PATIO",
    name: { en: "Patio Doors", uk: "Двері на терасу" },
    description: {
      en: "Bring more light into your home with patio doors.",
      uk: "Більше світла у вашому домі з дверима на терасу.",
    },
  },
  {
    slug: "sliding-doors",
    type: "SLIDING",
    name: { en: "Sliding Doors", uk: "Розсувні двері" },
    description: {
      en: "Space-saving sliding doors with a smooth, quiet action.",
      uk: "Розсувні двері, що економлять простір, з плавним і тихим ходом.",
    },
  },
  {
    slug: "french-doors",
    type: "FRENCH",
    name: { en: "French Doors", uk: "Французькі двері" },
    description: {
      en: "Classic double doors with glass panels.",
      uk: "Класичні подвійні двері зі скляними панелями.",
    },
  },
];

type Opt = { code: string; label: T; delta: number; swatch?: string; isDefault?: boolean };
const optionGroups: { code: string; name: T; values: Opt[] }[] = [
  {
    code: "size",
    name: { en: "Size", uk: "Розмір" },
    values: [
      { code: "762x1981", label: { en: "762 × 1981 mm (standard)", uk: "762 × 1981 мм (стандарт)" }, delta: 0, isDefault: true },
      { code: "838x1981", label: { en: "838 × 1981 mm", uk: "838 × 1981 мм" }, delta: 60 },
      { code: "914x2032", label: { en: "914 × 2032 mm (wide)", uk: "914 × 2032 мм (широкі)" }, delta: 140 },
    ],
  },
  {
    code: "colour",
    name: { en: "Colour", uk: "Колір" },
    values: [
      { code: "white", label: { en: "White", uk: "Білий" }, delta: 0, swatch: "#f5f5f2", isDefault: true },
      { code: "anthracite", label: { en: "Anthracite Grey", uk: "Антрацит" }, delta: 90, swatch: "#383e42" },
      { code: "oak", label: { en: "Golden Oak", uk: "Золотий дуб" }, delta: 120, swatch: "#b5803f" },
      { code: "green", label: { en: "Irish Green", uk: "Ірландський зелений" }, delta: 90, swatch: "#1f5c3a" },
      { code: "black", label: { en: "Black", uk: "Чорний" }, delta: 90, swatch: "#151515" },
    ],
  },
  {
    code: "glass",
    name: { en: "Glass", uk: "Скло" },
    values: [
      { code: "none", label: { en: "No glass", uk: "Без скла" }, delta: 0, isDefault: true },
      { code: "frosted", label: { en: "Frosted glass", uk: "Матове скло" }, delta: 110 },
      { code: "clear", label: { en: "Clear double glazing", uk: "Прозорий склопакет" }, delta: 150 },
    ],
  },
  {
    code: "handle",
    name: { en: "Handle", uk: "Ручка" },
    values: [
      { code: "chrome", label: { en: "Chrome lever", uk: "Хромована ручка" }, delta: 0, isDefault: true },
      { code: "black-bar", label: { en: "Black bar handle", uk: "Чорна ручка-скоба" }, delta: 45 },
      { code: "brass", label: { en: "Brass knob", uk: "Латунна ручка" }, delta: 35 },
    ],
  },
  {
    code: "swing",
    name: { en: "Opening side", uk: "Сторона відкривання" },
    values: [
      { code: "left", label: { en: "Left", uk: "Ліва" }, delta: 0, isDefault: true },
      { code: "right", label: { en: "Right", uk: "Права" }, delta: 0 },
    ],
  },
];

// [slug, category, material, price, featured, name, description, option codes]
type P = [string, string, string, number, boolean, T, T, string[]];
const all = ["size", "colour", "glass", "handle", "swing"];
const products: P[] = [
  ["dublin-composite-front-door", "exterior-doors", "Composite", 1290, true, { en: "Dublin Composite Front Door", uk: "Композитні вхідні двері Dublin" }, { en: "A strong, well-insulated composite door with a multi-point lock.", uk: "Міцні, добре утеплені композитні двері з багатоточковим замком." }, all],
  ["galway-aluminium-front-door", "exterior-doors", "Aluminium", 1890, true, { en: "Galway Aluminium Front Door", uk: "Алюмінієві вхідні двері Galway" }, { en: "Slim modern aluminium door with a flush finish.", uk: "Тонкі сучасні алюмінієві двері з гладкою поверхнею." }, all],
  ["kerry-oak-front-door", "exterior-doors", "Timber", 1650, false, { en: "Kerry Oak Front Door", uk: "Дубові вхідні двері Kerry" }, { en: "Solid oak entrance door with a traditional look.", uk: "Вхідні двері з масиву дуба у традиційному стилі." }, all],
  ["cork-steel-security-door", "exterior-doors", "Steel", 1450, false, { en: "Cork Steel Security Door", uk: "Сталеві броньовані двері Cork" }, { en: "Steel security door with reinforced frame.", uk: "Сталеві броньовані двері з посиленою рамою." }, ["size", "colour", "handle", "swing"]],
  ["wicklow-cottage-door", "exterior-doors", "Composite", 1150, false, { en: "Wicklow Cottage Door", uk: "Двері в котеджному стилі Wicklow" }, { en: "Cottage-style composite door with a small glass panel.", uk: "Композитні двері в котеджному стилі з невеликою скляною вставкою." }, all],
  ["liffey-white-panel-door", "interior-doors", "MDF", 189, true, { en: "Liffey White Panel Door", uk: "Білі філенчасті двері Liffey" }, { en: "Clean white four-panel interior door.", uk: "Чисті білі міжкімнатні двері з чотирма філенками." }, ["size", "glass", "handle", "swing"]],
  ["shannon-oak-interior-door", "interior-doors", "Oak veneer", 289, true, { en: "Shannon Oak Interior Door", uk: "Міжкімнатні двері з дуба Shannon" }, { en: "Warm oak veneer door with a modern line design.", uk: "Теплі двері з дубовим шпоном і сучасним дизайном ліній." }, ["size", "glass", "handle", "swing"]],
  ["boyne-grey-flush-door", "interior-doors", "MDF", 219, false, { en: "Boyne Grey Flush Door", uk: "Сірі гладкі двері Boyne" }, { en: "Smooth flush door in a soft grey finish.", uk: "Гладкі двері в м'якому сірому кольорі." }, ["size", "colour", "handle", "swing"]],
  ["barrow-glazed-interior-door", "interior-doors", "Pine", 259, false, { en: "Barrow Glazed Interior Door", uk: "Скляні міжкімнатні двері Barrow" }, { en: "Pine door with full-height frosted glass.", uk: "Соснові двері з матовим склом на всю висоту." }, ["size", "handle", "swing"]],
  ["slaney-black-industrial-door", "interior-doors", "Steel & glass", 549, true, { en: "Slaney Black Industrial Door", uk: "Чорні двері в стилі лофт Slaney" }, { en: "Black framed glass door in industrial style.", uk: "Скляні двері в чорній рамі у стилі лофт." }, ["size", "glass", "handle", "swing"]],
  ["moy-cottage-interior-door", "interior-doors", "Pine", 199, false, { en: "Moy Cottage Interior Door", uk: "Міжкімнатні двері Moy" }, { en: "Simple ledged pine door for a cottage feel.", uk: "Прості соснові двері для затишку котеджу." }, ["size", "handle", "swing"]],
  ["atlantic-patio-door", "patio-doors", "uPVC", 1490, true, { en: "Atlantic Patio Door", uk: "Двері на терасу Atlantic" }, { en: "Energy-efficient uPVC patio door with wide glass.", uk: "Енергоефективні ПВХ двері на терасу з великим склом." }, ["size", "colour", "handle", "swing"]],
  ["burren-aluminium-patio-door", "patio-doors", "Aluminium", 2290, false, { en: "Burren Aluminium Patio Door", uk: "Алюмінієві двері на терасу Burren" }, { en: "Slim aluminium frame for maximum light.", uk: "Тонка алюмінієва рама для максимуму світла." }, ["size", "colour", "handle", "swing"]],
  ["connemara-bifold-door", "patio-doors", "Aluminium", 3490, false, { en: "Connemara Bi-fold Door", uk: "Двері-гармошка Connemara" }, { en: "Three-panel bi-fold door that opens your room to the garden.", uk: "Тристулкові двері-гармошка, що відкривають кімнату в сад." }, ["size", "colour"]],
  ["howth-sliding-patio-door", "sliding-doors", "Aluminium", 1990, true, { en: "Howth Sliding Patio Door", uk: "Розсувні двері на терасу Howth" }, { en: "Large sliding glass door with a smooth rail.", uk: "Великі розсувні скляні двері з плавною направляючою." }, ["size", "colour", "handle"]],
  ["clare-pocket-door", "sliding-doors", "Oak veneer", 449, false, { en: "Clare Pocket Door", uk: "Двері-пенал Clare" }, { en: "Pocket sliding door that hides inside the wall.", uk: "Розсувні двері, що ховаються в стіну." }, ["size", "glass", "handle"]],
  ["sligo-barn-door", "sliding-doors", "Timber", 499, false, { en: "Sligo Barn Door", uk: "Амбарні двері Sligo" }, { en: "Rustic sliding barn door with black hardware.", uk: "Рустикальні розсувні амбарні двері з чорною фурнітурою." }, ["size", "colour"]],
  ["kilkenny-french-door", "french-doors", "Timber", 1390, true, { en: "Kilkenny French Doors", uk: "Французькі двері Kilkenny" }, { en: "Classic timber French doors with Georgian bars.", uk: "Класичні дерев'яні французькі двері з георгіанськими розкладками." }, all],
  ["waterford-upvc-french-door", "french-doors", "uPVC", 1190, false, { en: "Waterford uPVC French Doors", uk: "ПВХ французькі двері Waterford" }, { en: "Low-maintenance uPVC French doors.", uk: "ПВХ французькі двері, що не потребують догляду." }, ["size", "colour", "handle", "swing"]],
  ["donegal-interior-french-door", "french-doors", "Pine", 590, false, { en: "Donegal Interior French Doors", uk: "Міжкімнатні французькі двері Donegal" }, { en: "Glazed double doors between living and dining rooms.", uk: "Скляні подвійні двері між вітальнею та їдальнею." }, ["size", "glass", "handle"]],
];

async function main() {
  // Categories
  const categoryIds: Record<string, string> = {};
  for (const [i, c] of categories.entries()) {
    const row = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { type: c.type, sortOrder: i },
      create: { slug: c.slug, type: c.type, sortOrder: i },
    });
    categoryIds[c.slug] = row.id;
    for (const locale of ["en", "uk"] as const) {
      await prisma.categoryTranslation.upsert({
        where: { categoryId_locale: { categoryId: row.id, locale } },
        update: { name: c.name[locale], description: c.description[locale] },
        create: { categoryId: row.id, locale, name: c.name[locale], description: c.description[locale] },
      });
    }
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
    for (const locale of ["en", "uk"] as const) {
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
      for (const locale of ["en", "uk"] as const) {
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
    const data = { categoryId: categoryIds[cat]!, material, basePrice: price, featured, published: true };
    const product = await prisma.product.upsert({ where: { slug }, update: data, create: { slug, ...data } });
    for (const locale of ["en", "uk"] as const) {
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

  console.log(`Seeded ${categories.length} categories, ${optionGroups.length} option groups, ${products.length} products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
