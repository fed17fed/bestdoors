"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatPrice, type Locale } from "@bestdoors/shared";
import { Link } from "@/i18n/navigation";
import { announceEmptyCart, checkoutApi, type CheckoutSummary } from "@/lib/cart-client";

const POLL_MS = 2000;
const MAX_POLLS = 5;

/** After Stripe: asks the API about the session and shows the order result. */
export function CheckoutResult({ sessionId }: { sessionId: string }) {
  const t = useTranslations("Checkout");
  const locale = useLocale() as Locale;
  const [order, setOrder] = useState<CheckoutSummary | null>(null);
  const [failed, setFailed] = useState(!sessionId);

  useEffect(() => {
    if (!sessionId) return;
    let stop = false;
    let timer: ReturnType<typeof setTimeout>;
    async function load(attempt: number) {
      try {
        const result = await checkoutApi.session(sessionId);
        if (stop) return;
        setOrder(result);
        if (result.status === "PAID") announceEmptyCart();
        // Some payment methods confirm a bit later: ask again a few times.
        else if (result.status === "PENDING" && attempt < MAX_POLLS) {
          timer = setTimeout(() => load(attempt + 1), POLL_MS);
        }
      } catch {
        if (!stop) setFailed(true);
      }
    }
    load(1);
    return () => {
      stop = true;
      clearTimeout(timer);
    };
  }, [sessionId]);

  if (failed) {
    return (
      <Panel tone="warn" title={t("errorTitle")}>
        <p>{t("errorText")}</p>
        <Actions back />
      </Panel>
    );
  }
  if (!order) {
    return <p className="text-center text-muted" aria-busy="true">{t("checking")}</p>;
  }
  if (order.status === "CANCELLED") {
    return (
      <Panel tone="warn" title={t("cancelledTitle")}>
        <p>{t("cancelledText", { number: order.number })}</p>
        <Actions back />
      </Panel>
    );
  }
  if (order.status === "PENDING") {
    return (
      <Panel tone="wait" title={t("pendingTitle")}>
        <p>{t("pendingText", { number: order.number })}</p>
        <Actions />
      </Panel>
    );
  }
  return (
    <Panel tone="ok" title={t("paidTitle")}>
      <p>
        {order.email
          ? t("paidText", { number: order.number, email: order.email })
          : t("paidTextNoEmail", { number: order.number })}
      </p>
      <p className="font-semibold text-ink">{t("total", { total: formatPrice(order.total, locale) })}</p>
      <p>{t("nextSteps")}</p>
      <Actions />
    </Panel>
  );
}

function Panel({ tone, title, children }: { tone: "ok" | "wait" | "warn"; title: string; children: React.ReactNode }) {
  const icon = { ok: "✓", wait: "…", warn: "!" }[tone];
  const colour = { ok: "bg-brand text-white", wait: "bg-oak-soft text-oak", warn: "bg-oak text-white" }[tone];
  return (
    <section className="mx-auto max-w-xl rounded-2xl border border-line bg-surface p-8 text-center sm:p-10" role="status">
      <span aria-hidden className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full text-2xl font-bold ${colour}`}>
        {icon}
      </span>
      <h1 className="mt-5 text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
      <div className="mt-4 space-y-3 text-muted">{children}</div>
    </section>
  );
}

function Actions({ back = false }: { back?: boolean }) {
  const t = useTranslations("Checkout");
  return (
    <div className="flex flex-wrap justify-center gap-3 pt-4">
      {back && <Link href="/cart" className="btn-primary">{t("toCart")}</Link>}
      <Link href="/doors" className={back ? "btn-outline" : "btn-primary"}>{t("continue")}</Link>
    </div>
  );
}
