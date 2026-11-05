"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { LOCALES, type Locale } from "@bestdoors/shared";
import { usePathname, useRouter } from "@/i18n/navigation";

const LABELS: Record<Locale, string> = { en: "EN", uk: "UA" };
const NAMES: Record<Locale, string> = { en: "English", uk: "Українська" };

export function LanguageSwitcher() {
  const t = useTranslations("Nav");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function change(next: Locale) {
    const query = Object.fromEntries(searchParams.entries());
    startTransition(() => router.replace({ pathname, query }, { locale: next, scroll: false }));
  }

  return (
    <div role="group" aria-label={t("language")} className="flex rounded-full border border-line bg-surface p-0.5 text-xs font-bold">
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          title={NAMES[l]}
          aria-pressed={l === locale}
          disabled={pending}
          onClick={() => l !== locale && change(l)}
          className={`rounded-full px-2.5 py-1 transition-colors ${
            l === locale ? "bg-brand text-white" : "text-muted hover:text-ink"
          }`}
        >
          {LABELS[l]}
        </button>
      ))}
    </div>
  );
}
