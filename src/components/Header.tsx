"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { NavItem } from "@/lib/types";
import { localeNames, locales } from "@/lib/i18n";
import { useI18n } from "./I18nProvider";
import { useCart } from "./CartProvider";
import DrawerShell from "./DrawerShell";
import Icon from "./Icon";

function label(item: NavItem, t: (key: string) => string) {
  return item.labelKey ? t(item.labelKey) : (item.label ?? "");
}

export default function Header({ navigation }: { navigation: NavItem[] }) {
  const { t, path, locale } = useI18n();
  const cart = useCart();
  const router = useRouter();
  const pathname = usePathname();

  const [menuOpen, setMenuOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchInput = useRef<HTMLInputElement>(null);

  // Always the account page: guests are redirected on to /login from there,
  // which keeps this layout static instead of reading the session cookie.
  const accountUrl = path("/account");
  const restOfPath = pathname.split("/").slice(2).join("/");

  useEffect(() => {
    if (searchOpen) searchInput.current?.focus();
  }, [searchOpen]);

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSearchOpen(false);
    router.push(path(`/search?q=${encodeURIComponent(q)}`));
  }

  return (
    <div className="sticky top-0 z-30">
      <p className="bg-ink px-4 py-2 text-center text-[11px] tracking-wide2 text-paper uppercase">
        {t("general.announcement")}
      </p>

      <header className="border-b border-line bg-paper">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:py-5">
          <button
            type="button"
            className="-m-2 p-2 lg:hidden"
            aria-label={t("nav.menu_open")}
            onClick={() => setMenuOpen(true)}
          >
            <Icon name="menu" size={22} />
          </button>

          <Link
            href={path("/")}
            aria-label={t("nav.home_aria")}
            className="heading-brand text-lg whitespace-nowrap sm:text-xl"
          >
            Hystlovers
          </Link>

          <nav className="hidden lg:block" aria-label={t("nav.main_menu")}>
            <ul className="flex items-center gap-7">
              {navigation.map((item) => (
                <li key={item.url} className="group relative">
                  <Link
                    href={path(item.url)}
                    className={`flex items-center gap-1 py-2 text-xs font-medium tracking-wide2 uppercase transition-opacity hover:opacity-60 ${
                      pathname.startsWith(path(item.url)) ? "underline underline-offset-4" : ""
                    }`}
                  >
                    {label(item, t)}
                    {item.children && item.children.length > 0 && (
                      <Icon name="chevron-down" size={12} className="opacity-50" />
                    )}
                  </Link>

                  {item.children && item.children.length > 0 && (
                    <div className="invisible absolute top-full left-1/2 z-40 -translate-x-1/2 pt-1 opacity-0 transition-all duration-150 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                      <ul className="min-w-48 border border-line bg-paper py-2">
                        {item.children.map((child) => (
                          <li key={child.url}>
                            <Link
                              href={path(child.url)}
                              className="block px-5 py-2.5 text-xs tracking-wide2 uppercase transition-colors hover:bg-mist"
                            >
                              {label(child, t)}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <nav className="hidden items-center gap-1 sm:flex" aria-label={t("general.language")}>
              {locales.map((code) => (
                <Link
                  key={code}
                  href={`/${code}${restOfPath ? `/${restOfPath}` : ""}`}
                  hrefLang={code}
                  aria-current={code === locale ? "true" : undefined}
                  className={`px-1.5 py-1 text-[11px] font-medium tracking-wide2 uppercase transition-opacity ${
                    code === locale ? "text-ink underline underline-offset-4" : "text-ink/40 hover:text-ink"
                  }`}
                >
                  {localeNames[code].short}
                </Link>
              ))}
            </nav>

            <button
              type="button"
              className="-m-1 p-2 transition-opacity hover:opacity-60"
              aria-label={t("nav.search")}
              onClick={() => setSearchOpen(true)}
            >
              <Icon name="search" size={21} />
            </button>

            <Link
              href={accountUrl}
              className="hidden p-2 transition-opacity hover:opacity-60 sm:block"
              aria-label={t("nav.account")}
            >
              <Icon name="user" size={21} />
            </Link>

            <button
              type="button"
              className="relative -m-1 p-2 transition-opacity hover:opacity-60"
              aria-label={t("nav.cart_open", { count: cart.count })}
              onClick={cart.open}
            >
              <Icon name="bag" size={21} />
              {cart.count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-[18px] w-[18px] items-center justify-center bg-ink text-[10px] font-medium text-paper">
                  {cart.count}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <DrawerShell
        open={menuOpen}
        title={t("nav.menu")}
        side="left"
        onClose={() => setMenuOpen(false)}
      >
        <nav aria-label={t("nav.mobile_menu")}>
          <ul>
            {navigation.map((item) => {
              const children = item.children ?? [];
              return (
                <li key={item.url} className="border-b border-line">
                  {children.length > 0 ? (
                    <div className="flex items-stretch">
                      <Link
                        href={path(item.url)}
                        onClick={() => setMenuOpen(false)}
                        className="flex-1 px-5 py-4 text-sm tracking-wide2 uppercase"
                      >
                        {label(item, t)}
                      </Link>
                      <button
                        type="button"
                        className="px-5"
                        aria-expanded={expanded === item.url}
                        aria-label={t("nav.expand_children").replace(":label", label(item, t))}
                        onClick={() => setExpanded(expanded === item.url ? null : item.url)}
                      >
                        <Icon
                          name="chevron-down"
                          size={16}
                          className={`opacity-40 transition-transform duration-200 ${
                            expanded === item.url ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    </div>
                  ) : (
                    <Link
                      href={path(item.url)}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-between px-5 py-4 text-sm tracking-wide2 uppercase"
                    >
                      {label(item, t)}
                      <Icon name="chevron-right" size={16} className="opacity-40" />
                    </Link>
                  )}

                  {children.length > 0 && expanded === item.url && (
                    <ul className="bg-mist/50 pb-2">
                      {children.map((child) => (
                        <li key={child.url}>
                          <Link
                            href={path(child.url)}
                            onClick={() => setMenuOpen(false)}
                            className="block px-8 py-3 text-[13px] tracking-wide2 text-ink/70 uppercase"
                          >
                            {label(child, t)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="flex flex-col gap-6 px-5 py-6">
            <Link
              href={accountUrl}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 text-sm tracking-wide2 uppercase"
            >
              <Icon name="user" size={18} />
              {t("nav.my_account")}
            </Link>

            <div>
              <p className="text-[11px] tracking-wide2 text-ink/40 uppercase">
                {t("general.language")}
              </p>
              <div className="mt-2 flex gap-2">
                {locales.map((code) => (
                  <Link
                    key={code}
                    href={`/${code}${restOfPath ? `/${restOfPath}` : ""}`}
                    hrefLang={code}
                    onClick={() => setMenuOpen(false)}
                    className={`border px-3 py-1.5 text-xs tracking-wide2 uppercase ${
                      code === locale ? "border-ink bg-ink text-paper" : "border-line-strong"
                    }`}
                  >
                    {localeNames[code].short}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </nav>
      </DrawerShell>

      {searchOpen && (
        <div
          className="fixed inset-0 z-50 bg-ink/40"
          onClick={(event) => {
            if (event.target === event.currentTarget) setSearchOpen(false);
          }}
        >
          <div className="bg-paper px-4 py-6 sm:py-10">
            <form onSubmit={submitSearch} className="mx-auto flex max-w-2xl items-center gap-3">
              <Icon name="search" size={20} className="shrink-0 opacity-50" />
              <input
                ref={searchInput}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => event.key === "Escape" && setSearchOpen(false)}
                placeholder={t("nav.search_placeholder")}
                className="w-full border-0 bg-transparent py-2 text-base focus:outline-none sm:text-lg"
              />
              <button
                type="button"
                className="-m-2 shrink-0 p-2"
                aria-label={t("nav.search_close")}
                onClick={() => setSearchOpen(false)}
              >
                <Icon name="close" size={20} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
