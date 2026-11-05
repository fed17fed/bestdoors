"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatPrice, type Locale } from "@bestdoors/shared";
import { Link } from "@/i18n/navigation";
import { cartApi, checkoutApi, type Cart, type CartLine } from "@/lib/cart-client";
import { defaultDoorColour, defaultGlass, isDoubleDoor } from "@/lib/door-look";
import { DoorIllustration } from "./DoorIllustration";

function LineImage({ line }: { line: CartLine }) {
  if (line.image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={line.image.url} alt={line.image.alt || line.name} className="h-full w-full object-contain" />;
  }
  const code = (g: string) => line.options.find((o) => o.groupCode === g);
  return (
    <DoorIllustration
      className="h-full w-auto"
      colour={code("colour")?.swatch || defaultDoorColour(line.material)}
      glass={(code("glass")?.valueCode as "none" | "frosted" | "clear") ?? defaultGlass(line.categoryType)}
      handle={(code("handle")?.valueCode as "chrome" | "black-bar" | "brass") ?? "chrome"}
      side={code("swing")?.valueCode === "right" ? "right" : "left"}
      double={isDoubleDoor(line.categoryType)}
    />
  );
}

/** `cancelled`: Stripe sent the customer back with ?checkout=cancelled. */
export function CartView({ cancelled = false }: { cancelled?: boolean }) {
  const t = useTranslations("Cart");
  const locale = useLocale() as Locale;
  const [cart, setCart] = useState<Cart | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState(false);

  useEffect(() => {
    cartApi.get(locale).then(setCart).catch(() => setFailed(true));
  }, [locale]);

  async function checkout() {
    setPaying(true);
    setPayError(false);
    try {
      const { url } = await checkoutApi.start(locale);
      window.location.assign(url);
    } catch {
      setPayError(true);
      setPaying(false);
    }
  }

  async function run(id: string, action: () => Promise<Cart>) {
    setBusy(id);
    try {
      setCart(await action());
    } catch {
      setFailed(true);
    } finally {
      setBusy(null);
    }
  }

  if (failed) return <p role="alert" className="mt-8 text-red-700">{t("error")}</p>;
  if (!cart) return <p className="mt-8 text-muted" aria-busy="true">{t("loading")}</p>;
  if (cart.items.length === 0) {
    return (
      <div className="mt-8 rounded-2xl border border-dashed border-line p-12 text-center">
        <p className="text-lg text-muted">{t("empty")}</p>
        <Link href="/doors" className="btn-primary mt-6">{t("emptyCta")}</Link>
      </div>
    );
  }

  return (
    <>
    {cancelled && (
      <p role="status" className="mt-6 rounded-xl border border-oak/40 bg-oak-soft px-4 py-3 text-sm">{t("cancelled")}</p>
    )}
    <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
      <section>
        <p className="mb-3 text-sm text-muted">{t("items", { count: cart.count })}</p>
        <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
          {cart.items.map((line) => (
            <li key={line.id} className={`flex gap-4 p-4 sm:gap-6 sm:p-5 ${busy === line.id ? "opacity-60" : ""}`}>
              <div className="flex h-32 w-24 shrink-0 items-center justify-center rounded-xl bg-canvas p-2">
                <LineImage line={line} />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/doors/${line.categorySlug}/${line.slug}`} className="font-bold hover:underline">
                    {line.name}
                  </Link>
                  <p className="shrink-0 font-bold">{formatPrice(line.lineTotal, locale)}</p>
                </div>
                <ul className="mt-1 space-y-0.5 text-sm text-muted">
                  {line.options.map((o) => (
                    <li key={o.groupCode}>{o.group}: <span className="text-ink">{o.value}</span></li>
                  ))}
                </ul>
                <div className="mt-auto flex flex-wrap items-center gap-4 pt-3">
                  <div className="flex items-center rounded-full border border-line" role="group" aria-label={t("quantity")}>
                    <button type="button" aria-label={t("decrease")} disabled={busy !== null || line.quantity <= 1}
                      onClick={() => run(line.id, () => cartApi.update(locale, line.id, line.quantity - 1))}
                      className="h-9 w-9 rounded-full text-lg disabled:opacity-30">−</button>
                    <span className="w-8 text-center text-sm font-semibold" aria-live="polite">{line.quantity}</span>
                    <button type="button" aria-label={t("increase")} disabled={busy !== null || line.quantity >= 20}
                      onClick={() => run(line.id, () => cartApi.update(locale, line.id, line.quantity + 1))}
                      className="h-9 w-9 rounded-full text-lg disabled:opacity-30">+</button>
                  </div>
                  <span className="text-xs text-muted">{t("each", { price: formatPrice(line.unitPrice, locale) })}</span>
                  <button type="button" disabled={busy !== null}
                    onClick={() => run(line.id, () => cartApi.remove(locale, line.id))}
                    className="ml-auto text-sm font-semibold text-muted underline hover:text-red-700">
                    {t("remove")}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <Link href="/doors" className="mt-4 inline-block text-sm font-semibold text-brand hover:underline">← {t("continue")}</Link>
      </section>

      <aside className="h-fit rounded-2xl border border-line bg-surface p-6 lg:sticky lg:top-24" aria-labelledby="summary">
        <h2 id="summary" className="text-lg font-bold">{t("summary")}</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between"><dt>{t("subtotal")}</dt><dd className="font-semibold">{formatPrice(cart.subtotal, locale)}</dd></div>
          <div className="flex justify-between text-muted"><dt>{t("vat")}</dt><dd>{formatPrice(cart.vat, locale)}</dd></div>
          <div className="flex justify-between text-muted"><dt>{t("delivery")}</dt><dd>{t("deliveryNote")}</dd></div>
          <div className="flex justify-between border-t border-line pt-3 text-base"><dt className="font-bold">{t("total")}</dt><dd className="font-extrabold">{formatPrice(cart.subtotal, locale)}</dd></div>
        </dl>
        <button type="button" onClick={checkout} disabled={paying || busy !== null} aria-busy={paying}
          className="btn-primary mt-6 w-full py-3 disabled:opacity-60">
          {paying ? t("checkoutBusy") : t("checkout")}
        </button>
        {payError && <p role="alert" className="mt-2 text-center text-sm text-red-700">{t("checkoutError")}</p>}
        <p className="mt-2 text-center text-xs text-muted">{t("securePayment")}</p>
        <Link href="/quote" className="btn-outline mt-3 w-full">{t("requestQuote")}</Link>
      </aside>
    </div>
    </>
  );
}
