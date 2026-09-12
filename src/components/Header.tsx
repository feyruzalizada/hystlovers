"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { NavItem } from "@/lib/types";
import { useI18n } from "./I18nProvider";
import { useCart } from "./CartProvider";
import LocaleSwitcher from "./LocaleSwitcher";

function label(item: NavItem, t: (key: string) => string) {
  return item.labelKey ? t(item.labelKey) : (item.label ?? "");
}

export default function Header({ navigation }: { navigation: NavItem[] }) {
  const { t, path } = useI18n();
  const cart = useCart();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const searchInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) searchInput.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    if (!query.trim()) return;
    setSearchOpen(false);
    setMenuOpen(false);
    router.push(path(`/search?q=${encodeURIComponent(query.trim())}`));
  }

  return (
    <header className="sticky top-0 z-40 bg-paper">
      <div className="bg-ink px-4 py-2 text-center text-[11px] tracking-brand text-paper uppercase">
        {t("general.announcement")}
      </div>

      <div className="border-b border-line">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-4 px-4 md:px-8">
          <button
            type="button"
            className="text-xs tracking-brand uppercase lg:hidden"
            aria-label={t("nav.menu_open")}
            onClick={() => setMenuOpen(true)}
          >
            {t("nav.menu")}
          </button>

          <nav aria-label={t("nav.main_menu")} className="hidden items-center gap-8 lg:flex">
            {navigation.map((item) => (
              <div
                key={item.url}
                className="relative"
                onMouseEnter={() => setExpanded(item.url)}
                onMouseLeave={() => setExpanded(null)}
              >
                <Link
                  href={path(item.url)}
                  className="block py-5 text-xs tracking-brand uppercase hover:text-ink-soft"
                >
                  {label(item, t)}
                </Link>
                {item.children && item.children.length > 0 && expanded === item.url && (
                  <div className="absolute top-full left-0 min-w-56 border border-line bg-paper py-3">
                    {item.children.map((child) => (
                      <Link
                        key={child.url}
                        href={path(child.url)}
                        className="block px-5 py-2 text-xs tracking-brand uppercase hover:bg-mist"
                      >
                        {label(child, t)}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          <Link
            href={path("/")}
            aria-label={t("nav.home_aria")}
            className="heading-brand absolute left-1/2 -translate-x-1/2 text-lg"
          >
            Hystlovers
          </Link>

          <div className="flex items-center gap-5 text-xs tracking-brand uppercase">
            <LocaleSwitcher />
            <button type="button" onClick={() => setSearchOpen(true)}>
              {t("nav.search")}
            </button>
            <Link href={path("/account")} className="hidden sm:inline">
              {t("nav.account")}
            </Link>
            <button
              type="button"
              onClick={cart.open}
              aria-label={t("nav.cart_open", { count: cart.count })}
            >
              {t("cart.title")} ({cart.count})
            </button>
          </div>
        </div>
      </div>

      {searchOpen && (
        <div className="border-b border-line bg-paper">
          <form onSubmit={submitSearch} className="mx-auto flex max-w-[1400px] gap-3 px-4 py-5 md:px-8">
            <input
              ref={searchInput}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("nav.search_placeholder")}
              className="input-brand"
            />
            <button type="submit" className="btn-primary">
              {t("nav.search_submit")}
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setSearchOpen(false)}
              aria-label={t("nav.search_close")}
            >
              {t("general.close")}
            </button>
          </form>
        </div>
      )}

      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-paper lg:hidden" aria-label={t("nav.mobile_menu")}>
          <div className="flex h-16 items-center justify-between border-b border-line px-4">
            <span className="heading-brand text-sm">{t("nav.menu")}</span>
            <button type="button" className="btn-ghost" onClick={() => setMenuOpen(false)}>
              {t("general.close")}
            </button>
          </div>
          <nav className="overflow-y-auto px-4 py-6">
            {navigation.map((item) => (
              <div key={item.url} className="border-b border-line py-3">
                <div className="flex items-center justify-between">
                  <Link
                    href={path(item.url)}
                    onClick={() => setMenuOpen(false)}
                    className="text-sm tracking-brand uppercase"
                  >
                    {label(item, t)}
                  </Link>
                  {item.children && item.children.length > 0 && (
                    <button
                      type="button"
                      aria-label={t("nav.expand_children").replace(":label", label(item, t))}
                      onClick={() => setExpanded(expanded === item.url ? null : item.url)}
                      className="px-3 text-lg leading-none"
                    >
                      {expanded === item.url ? "−" : "+"}
                    </button>
                  )}
                </div>
                {item.children && expanded === item.url && (
                  <div className="mt-3 flex flex-col gap-2 pl-4">
                    {item.children.map((child) => (
                      <Link
                        key={child.url}
                        href={path(child.url)}
                        onClick={() => setMenuOpen(false)}
                        className="text-xs tracking-brand text-ink-soft uppercase"
                      >
                        {label(child, t)}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <Link
              href={path("/account")}
              onClick={() => setMenuOpen(false)}
              className="mt-6 block text-sm tracking-brand uppercase"
            >
              {t("nav.account")}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
