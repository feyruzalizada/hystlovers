"use client";

import Link from "next/link";
import { useI18n } from "@/components/I18nProvider";

/**
 * Client-rendered so the language comes from the layout's provider: reading a
 * cookie here would opt every page under [locale] out of static rendering.
 */
export default function NotFound() {
  const { t, path } = useI18n();

  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center sm:py-32">
      <p className="heading-brand text-6xl text-ink/15">404</p>
      <h1 className="heading-brand mt-6 text-xl">{t("error.404.title")}</h1>
      <p className="mt-4 text-sm text-ink/60">{t("error.404.body")}</p>
      <Link href={path("/")} className="btn-primary mt-10">
        {t("error.404.cta")}
      </Link>
    </div>
  );
}
