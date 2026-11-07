-- Remove Ukrainian: the shop is English only.
-- 1) Delete the Ukrainian translation rows (catalog texts).
-- 2) Users, orders and quotes are NOT deleted: their locale is set to 'en'.
-- 3) Replace the "Locale" enum with one that has only 'en'.
-- Safe to run more than once on data (the DELETE/UPDATE steps do nothing when there is no 'uk' row).

DELETE FROM "CategoryTranslation" WHERE "locale" = 'uk';
DELETE FROM "ProductTranslation" WHERE "locale" = 'uk';
DELETE FROM "OptionGroupTranslation" WHERE "locale" = 'uk';
DELETE FROM "OptionValueTranslation" WHERE "locale" = 'uk';

UPDATE "User" SET "locale" = 'en' WHERE "locale" = 'uk';
UPDATE "Order" SET "locale" = 'en' WHERE "locale" = 'uk';
UPDATE "QuoteRequest" SET "locale" = 'en' WHERE "locale" = 'uk';

CREATE TYPE "Locale_new" AS ENUM ('en');

ALTER TABLE "User" ALTER COLUMN "locale" DROP DEFAULT;
ALTER TABLE "Order" ALTER COLUMN "locale" DROP DEFAULT;
ALTER TABLE "QuoteRequest" ALTER COLUMN "locale" DROP DEFAULT;

ALTER TABLE "CategoryTranslation" ALTER COLUMN "locale" TYPE "Locale_new" USING ("locale"::text::"Locale_new");
ALTER TABLE "ProductTranslation" ALTER COLUMN "locale" TYPE "Locale_new" USING ("locale"::text::"Locale_new");
ALTER TABLE "OptionGroupTranslation" ALTER COLUMN "locale" TYPE "Locale_new" USING ("locale"::text::"Locale_new");
ALTER TABLE "OptionValueTranslation" ALTER COLUMN "locale" TYPE "Locale_new" USING ("locale"::text::"Locale_new");
ALTER TABLE "User" ALTER COLUMN "locale" TYPE "Locale_new" USING ("locale"::text::"Locale_new");
ALTER TABLE "Order" ALTER COLUMN "locale" TYPE "Locale_new" USING ("locale"::text::"Locale_new");
ALTER TABLE "QuoteRequest" ALTER COLUMN "locale" TYPE "Locale_new" USING ("locale"::text::"Locale_new");

ALTER TABLE "User" ALTER COLUMN "locale" SET DEFAULT 'en';
ALTER TABLE "Order" ALTER COLUMN "locale" SET DEFAULT 'en';
ALTER TABLE "QuoteRequest" ALTER COLUMN "locale" SET DEFAULT 'en';

DROP TYPE "Locale";
ALTER TYPE "Locale_new" RENAME TO "Locale";
