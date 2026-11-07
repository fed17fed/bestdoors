// Creates (or updates) ONE admin user. Does not touch the catalog or any other data.
// Usage: DATABASE_URL="<neon direct url>" ADMIN_EMAIL="..." ADMIN_PASSWORD="..." npx tsx prisma/create-admin.ts
// If the user already exists, the role becomes ADMIN and the password is replaced.
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;

if (!connectionString) throw new Error("DATABASE_URL is not set");
if (!email || !email.includes("@")) throw new Error("ADMIN_EMAIL is not set or not valid");
if (!password || password.length < 10) throw new Error("ADMIN_PASSWORD must be at least 10 characters");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const passwordHash = await bcrypt.hash(password!, 12);
  const user = await prisma.user.upsert({
    where: { email: email! },
    update: { role: "ADMIN", passwordHash },
    create: { email: email!, name: "BestDoors Admin", role: "ADMIN", passwordHash },
  });
  const host = new URL(connectionString!).host;
  console.log(`OK: admin ${user.email} (role ${user.role}) saved in database at ${host}`);
}

main()
  .catch((e) => {
    console.error("FAILED:", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
