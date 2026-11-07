import "dotenv/config";
import { fileURLToPath } from "node:url";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { cleanHtml } from "../src/lib/sanitize-html";
import { DEFAULT_PAGES } from "./default-pages";

/**
 * Creates the info pages (About, Delivery, Returns, Privacy, Terms, Contact) that do not exist yet.
 * SAFE TO RUN AGAIN: a page that already exists is never changed, so edits made in the admin panel stay.
 * Returns how many pages were created.
 */
export async function seedPages(prisma: PrismaClient): Promise<number> {
  let created = 0;
  for (const page of DEFAULT_PAGES) {
    const exists = await prisma.page.findUnique({ where: { slug: page.slug }, select: { id: true } });
    if (exists) continue;
    await prisma.page.create({ data: { ...page, content: cleanHtml(page.content) } });
    created++;
  }
  return created;
}

// Run alone: `npm run db:seed-pages` (for example on Neon: only DATABASE_URL is needed).
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  seedPages(prisma)
    .then((n) => console.log(`Info pages: ${n} created, ${DEFAULT_PAGES.length - n} already existed.`))
    .catch((e) => {
      console.error(e);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
