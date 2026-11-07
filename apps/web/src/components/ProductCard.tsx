import { getTranslations } from "next-intl/server";
import { formatPrice, type Locale } from "@bestdoors/shared";
import { Link } from "@/i18n/navigation";
import type { ProductCard as Product } from "@/lib/types";
import { defaultDoorColour, defaultGlass, isDoubleDoor } from "@/lib/door-look";
import { DoorIllustration } from "./DoorIllustration";

export async function ProductCard({ product, locale }: { product: Product; locale: Locale }) {
  const t = await getTranslations("Product");
  const href = `/doors/${product.category.slug}/${product.slug}`;
  return (
    <article className="group relative flex flex-col lift overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="flex aspect-[4/5] items-center justify-center bg-gradient-to-b from-glow/70 to-white p-6">
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image.url} alt={product.image.alt || product.name} className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <DoorIllustration
            className="door-swing h-full w-auto drop-shadow-sm"
            colour={defaultDoorColour(product.material)}
            glass={defaultGlass(product.category.type)}
            double={isDoubleDoor(product.category.type)}
            title={product.name}
          />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          {product.category.name} · {product.material}
        </p>
        <h3 className="font-semibold leading-snug">
          <Link href={href} className="after:absolute after:inset-0">
            {product.name}
          </Link>
        </h3>
        <p className="mt-auto pt-2 text-sm text-muted">
          {t("from")} <span className="text-base font-bold text-ink">{formatPrice(product.price, locale)}</span>
        </p>
      </div>
    </article>
  );
}
