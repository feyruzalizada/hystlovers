"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { locales, localeNames } from "@/lib/i18n";
import { useI18n } from "./I18nProvider";

export default function LocaleSwitcher() {
  const { locale, t } = useI18n();
  const pathname = usePathname();
  const rest = pathname.split("/").slice(2).join("/");

  return (
    <div className="flex items-center gap-2" aria-label={t("general.language")}>
      {locales.map((code) => (
        <Link
          key={code}
          href={`/${code}${rest ? `/${rest}` : ""}`}
          className={code === locale ? "underline underline-offset-4" : "text-ink-soft"}
        >
          {localeNames[code].short}
        </Link>
      ))}
    </div>
  );
}
