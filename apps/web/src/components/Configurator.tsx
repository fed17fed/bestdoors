"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatPrice, type Locale } from "@bestdoors/shared";
import { Link } from "@/i18n/navigation";
import type { ProductDetail } from "@/lib/types";
import { cartApi } from "@/lib/cart-client";
import { defaultDoorColour, defaultGlass, isDoubleDoor } from "@/lib/door-look";
import { DoorIllustration } from "./DoorIllustration";

type Selection = Record<string, string>;

function initialSelection(product: ProductDetail): Selection {
  return Object.fromEntries(
    product.optionGroups.map((g) => [g.id, (g.values.find((v) => v.isDefault) ?? g.values[0]).id]),
  );
}

export function Configurator({ product }: { product: ProductDetail }) {
  const t = useTranslations("Product");
  const locale = useLocale() as Locale;
  const [selection, setSelection] = useState<Selection>(() => initialSelection(product));
  const [serverPrice, setServerPrice] = useState<number | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [cartState, setCartState] = useState<"idle" | "adding" | "added" | "error">("idle");
  const first = useRef(true);

  // Instant price on the client (for a fast UI)…
  const localPrice = useMemo(
    () =>
      product.optionGroups.reduce((sum, g) => {
        const v = g.values.find((x) => x.id === selection[g.id]);
        return sum + (v?.priceDelta ?? 0);
      }, product.price),
    [product, selection],
  );

  // …confirmed by the server, which is the source of truth.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setStatus("loading");
      try {
        const res = await fetch(`/api/v1/products/${product.id}/price?locale=${locale}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selection }),
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as { price: number };
        setServerPrice(data.price);
        setStatus("idle");
      } catch (e) {
        if ((e as Error).name !== "AbortError") setStatus("error");
      }
    }, 250);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [selection, product.id, locale]);

  const valueCode = (code: string) => {
    const g = product.optionGroups.find((x) => x.code === code);
    return g?.values.find((v) => v.id === selection[g.id]);
  };
  const colour = valueCode("colour")?.swatch || defaultDoorColour(product.material);
  const glassCode = valueCode("glass")?.code as "none" | "frosted" | "clear" | undefined;
  const handleCode = valueCode("handle")?.code as "chrome" | "black-bar" | "brass" | undefined;
  const side = valueCode("swing")?.code === "right" ? "right" : "left";
  const price = status === "idle" && serverPrice !== null ? serverPrice : localPrice;

  async function addToCart() {
    setCartState("adding");
    try {
      await cartApi.add(locale, product.id, selection, 1);
      setCartState("added");
    } catch {
      setCartState("error");
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <div className="flex items-center justify-center rounded-3xl bg-gradient-to-b from-oak-soft to-canvas p-10 lg:sticky lg:top-24 lg:self-start">
        {product.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.images[0].url} alt={product.images[0].alt || product.name} className="max-h-[520px] w-full object-contain" />
        ) : (
          <DoorIllustration
            className="h-[420px] w-auto drop-shadow-md sm:h-[520px]"
            colour={colour}
            glass={glassCode ?? defaultGlass(product.category.type)}
            handle={handleCode ?? "chrome"}
            double={isDoubleDoor(product.category.type)}
            side={side}
            title={product.name}
          />
        )}
      </div>

      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-oak-text">{product.category.name}</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">{product.name}</h1>
        <p className="mt-3 text-muted">{product.description}</p>
        <p className="mt-2 text-sm text-muted">
          {t("material")}: <span className="font-semibold text-ink">{product.material}</span>
        </p>

        {product.optionGroups.length > 0 && (
          <section aria-labelledby="configure" className="mt-8 space-y-6">
            <h2 id="configure" className="text-lg font-bold">{t("configure")}</h2>
            {product.optionGroups.map((g) => (
              <fieldset key={g.id}>
                <legend className="label">{g.name}</legend>
                <div className="flex flex-wrap gap-2">
                  {g.values.map((v) => {
                    const checked = selection[g.id] === v.id;
                    return (
                      <label
                        key={v.id}
                        className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand ${
                          checked ? "border-brand bg-brand-soft font-semibold" : "border-line bg-surface hover:border-ink/30"
                        }`}
                      >
                        <input
                          type="radio"
                          name={g.code}
                          value={v.id}
                          checked={checked}
                          onChange={() => {
                            setSelection((s) => ({ ...s, [g.id]: v.id }));
                            setCartState("idle");
                          }}
                          className="sr-only"
                        />
                        {v.swatch && (
                          <span aria-hidden className="h-4 w-4 rounded-full border border-black/10" style={{ background: v.swatch }} />
                        )}
                        <span>{v.label}</span>
                        {v.priceDelta > 0 && <span className="text-muted">+{formatPrice(v.priceDelta, locale)}</span>}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </section>
        )}

        <div className="mt-8 rounded-2xl border border-line bg-surface p-5">
          <p className="text-sm text-muted">{t("total")}</p>
          <p className="text-3xl font-extrabold" aria-live="polite">
            {formatPrice(price, locale)}
            <span className="ml-2 text-sm font-medium text-muted">{t("vatIncluded")}</span>
          </p>
          {status === "loading" && <p className="mt-1 text-xs text-muted">{t("updating")}</p>}
          {status === "error" && <p role="alert" className="mt-1 text-xs text-red-700">{t("priceError")}</p>}
          <button type="button" className="btn-primary mt-4 w-full py-3" onClick={addToCart} disabled={cartState === "adding"}>
            {cartState === "adding" ? t("adding") : t("addToCart")}
          </button>
          <div role="status" className="mt-2 text-center text-sm">
            {cartState === "added" && (
              <span className="text-brand">
                ✓ {t("added")}{" "}
                <Link href="/cart" className="font-semibold underline">{t("viewCart")}</Link>
              </span>
            )}
            {cartState === "error" && <span className="text-red-700">{t("addError")}</span>}
          </div>
          <Link href={{ pathname: "/quote", query: { product: product.slug } }} className="mt-3 block text-center text-sm font-semibold text-brand hover:underline">
            {t("requestQuote")}
          </Link>
        </div>
      </div>
    </div>
  );
}
