"use client";

import Link from "next/link";
import type { FooterGroup } from "@/lib/types";
import { useI18n } from "./I18nProvider";
import NewsletterForm from "./NewsletterForm";

export default function Footer({ groups }: { groups: FooterGroup[] }) {
  const { t, path } = useI18n();

  return (
    <footer className="mt-24 border-t border-line bg-mist">
      <div className="mx-auto grid max-w-[1400px] gap-10 px-4 py-16 md:grid-cols-3 md:px-8">
        <div>
          <span className="heading-brand text-base">Hystlovers</span>
          <p className="mt-4 max-w-xs text-sm text-ink-soft">{t("footer.brand_text")}</p>
        </div>

        {groups.map((group) => (
          <div key={group.titleKey ?? group.title}>
            <h2 className="heading-brand text-xs">
              {group.titleKey ? t(group.titleKey) : group.title}
            </h2>
            <ul className="mt-5 flex flex-col gap-3">
              {group.links.map((link) => (
                <li key={link.url}>
                  <Link href={path(link.url)} className="text-sm text-ink-soft hover:text-ink">
                    {link.labelKey ? t(link.labelKey) : link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mx-auto max-w-[1400px] px-4 pb-12 md:px-8">
        <h2 className="heading-brand text-xs">{t("footer.newsletter.title")}</h2>
        <NewsletterForm />
      </div>

      <div className="border-t border-line px-4 py-6 text-center text-xs tracking-brand text-ink-soft uppercase md:px-8">
        © {new Date().getFullYear()} Hystlovers. {t("general.rights")}
      </div>
    </footer>
  );
}
