import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Category } from "@/lib/types";
import { defaultGlass, isDoubleDoor } from "@/lib/door-look";
import { DoorIllustration } from "./DoorIllustration";

/**
 * A category as a link tile: category image (or a door drawing when no image is set), name and product count.
 * "large" = home page main tile, "small" = subcategory tile.
 * The drawing is decorative (aria-hidden); the link text is name + count.
 */
export async function CategoryTile({
  category,
  colour,
  size = "small",
  reveal = false,
}: {
  category: Category;
  colour: string;
  size?: "large" | "small";
  reveal?: boolean;
}) {
  const t = await getTranslations("Home");
  const large = size === "large";
  return (
    <Link
      href={`/doors/${category.slug}`}
      data-testid="category-tile"
      className={`${reveal ? "reveal " : ""}group lift flex w-full rounded-2xl border border-line bg-surface ${
        large ? "flex-col items-center gap-4 p-5 sm:flex-row sm:gap-8 sm:p-8" : "flex-col gap-2 p-3 sm:flex-row sm:items-center sm:gap-4 sm:p-4"
      }`}
    >
      <div
        aria-hidden
        className={`flex items-center justify-center rounded-xl bg-gradient-to-b from-glow/60 to-white ${
          large ? "aspect-[4/3] w-full sm:aspect-square sm:w-2/5" : "h-20 w-full sm:h-28 sm:w-24 sm:shrink-0"
        }`}
      >
        {category.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- admin images can come from any https host
          <img src={category.imageUrl} alt="" className="h-full w-full rounded-xl object-cover" />
        ) : (
          <DoorIllustration
            className={`door-swing w-auto ${large ? "h-4/5" : "h-[90%]"}`}
            colour={colour}
            glass={defaultGlass(category.type)}
            double={isDoubleDoor(category.type)}
          />
        )}
      </div>
      <div className={large ? "text-center sm:flex-1 sm:text-left" : "min-w-0"}>
        <h3 className={large ? "text-2xl font-black tracking-tight text-navy sm:text-3xl" : "font-bold leading-snug"}>{category.name}</h3>
        <p className="mt-1 text-sm text-muted">{t("doorsCount", { count: category.totalProductCount })}</p>
        {large && <span className="mt-4 inline-flex items-center gap-1 font-semibold text-brand group-hover:underline">{t("viewAll")} →</span>}
      </div>
    </Link>
  );
}
