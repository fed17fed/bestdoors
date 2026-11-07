"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CART_EVENT, cartApi, type Cart } from "@/lib/cart-client";

/** Header cart button with a live item counter. */
export function CartLink() {
  const t = useTranslations("Cart");
  const nav = useTranslations("Nav");
  const locale = useLocale();
  const [count, setCount] = useState(0);

  useEffect(() => {
    cartApi.get(locale).then((c) => setCount(c.count)).catch(() => {});
    const onChange = (e: Event) => setCount((e as CustomEvent<Cart>).detail.count);
    window.addEventListener(CART_EVENT, onChange);
    return () => window.removeEventListener(CART_EVENT, onChange);
  }, [locale]);

  return (
    <Link href="/cart" aria-label={t("cartLabel", { count })} className="inline-flex items-center gap-1.5 rounded-full px-2 py-1.5 text-sm font-semibold hover:bg-surface">
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h9.2a1 1 0 0 0 1-.8L20 8H6.2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="9" cy="20" r="1.4" />
        <circle cx="17" cy="20" r="1.4" />
      </svg>
      <span className="hidden sm:inline">{nav("cart")}</span>
      {count > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold text-navy">
          {count}
        </span>
      )}
    </Link>
  );
}
