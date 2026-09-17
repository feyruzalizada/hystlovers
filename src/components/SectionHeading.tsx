"use client";

import Link from "next/link";
import { useI18n } from "./I18nProvider";

export default function SectionHeading({ title, url }: { title: string; url?: string }) {
  const { t, path } = useI18n();

  return (
    <div className="mb-6 flex items-end justify-between sm:mb-10">
      <h2 className="heading-brand text-lg sm:text-2xl">{title}</h2>
      {url && (
        <Link href={path(url)} className="btn-ghost text-[11px] sm:text-xs">
          {t("home.view_all")}
        </Link>
      )}
    </div>
  );
}
