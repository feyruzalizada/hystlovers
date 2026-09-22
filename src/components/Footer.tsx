"use client";

import Link from "next/link";
import type { FooterGroup, NavItem } from "@/lib/types";
import { useI18n } from "./I18nProvider";
import NewsletterForm from "./NewsletterForm";

export default function Footer({ groups }: { groups: FooterGroup[] }) {
  const { t, path } = useI18n();
  const label = (link: NavItem) => (link.labelKey ? t(link.labelKey) : link.label);

  return (
    <footer className="bg-ink text-paper">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-4 lg:gap-8 lg:py-16">
        <div className="lg:col-span-2 lg:max-w-md">
          <p className="heading-brand text-lg">Hystlovers</p>
          <p className="mt-4 text-sm leading-relaxed text-paper/60">{t("footer.brand_text")}</p>

          <div className="mt-8">
            <p className="text-xs font-medium tracking-brand uppercase">
              {t("footer.newsletter.title")}
            </p>
            <NewsletterForm />
          </div>
        </div>

        {groups.map((group) => (
          <nav key={group.titleKey ?? group.title} aria-label={group.titleKey ? t(group.titleKey) : group.title}>
            <p className="text-xs font-medium tracking-brand uppercase">
              {group.titleKey ? t(group.titleKey) : group.title}
            </p>
            <ul className="mt-5 space-y-3">
              {group.links.map((link) => (
                <li key={link.url}>
                  <Link
                    href={path(link.url)}
                    className="text-sm text-paper/60 transition-colors hover:text-paper"
                  >
                    {label(link)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-paper/15">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-[11px] text-paper/40 sm:flex-row sm:px-6">
          <p>
            © {new Date().getFullYear()} Hystlovers. {t("general.rights")}
          </p>
          <p>
            Developed by{" "}
            <a
              href="https://burncode.org"
              target="_blank"
              rel="noopener"
              className="font-medium tracking-wide2 text-paper/70 uppercase underline decoration-paper/30 underline-offset-4 transition-colors hover:text-paper hover:decoration-paper"
            >
              Burncode LLC
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
