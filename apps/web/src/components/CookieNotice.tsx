"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

// Only necessary cookies are used, so no consent is needed: this is an information notice.
// If analytics are added later, this must become a real Accept / Reject banner.
const KEY = "bd_cookie_notice";
const listeners = new Set<() => void>();

function read(): boolean {
  try {
    return localStorage.getItem(KEY) === "ok";
  } catch {
    return false; // storage blocked: show the notice, closing works for this page view
  }
}
let closedInMemory = false;

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function CookieNotice() {
  const t = useTranslations("Cookie");
  // Server: "closed" (nothing rendered, no hydration mismatch). Browser: real value.
  const closed = useSyncExternalStore(subscribe, () => closedInMemory || read(), () => true);
  if (closed) return null;

  function close() {
    closedInMemory = true;
    try {
      localStorage.setItem(KEY, "ok");
    } catch {
      // ignore
    }
    listeners.forEach((cb) => cb());
  }

  return (
    <div role="region" aria-label="Cookies" className="fixed inset-x-0 bottom-0 z-40 p-3 sm:p-4">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-2xl border border-line bg-surface p-4 shadow-lg sm:flex-row sm:items-center">
        <p className="flex-1 text-sm">
          {t("text")}{" "}
          <Link href="/privacy#cookies" className="font-semibold text-brand underline">{t("more")}</Link>
        </p>
        <button type="button" onClick={close} className="btn-primary shrink-0 px-6">{t("ok")}</button>
      </div>
    </div>
  );
}
