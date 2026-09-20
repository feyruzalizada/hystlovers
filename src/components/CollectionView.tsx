"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import type { Facets, Product, SortKey } from "@/lib/types";
import { useI18n } from "./I18nProvider";
import DrawerShell from "./DrawerShell";
import FilterPanel, { type FilterState } from "./FilterPanel";
import Icon from "./Icon";
import ProductCard from "./ProductCard";

const PER_PAGE = 12;

// The colour in the URL is browser state, so it is read as an external store:
// the prerendered HTML renders unfiltered and React applies it on hydration.
const noopSubscribe = () => () => {};
const readUrlColor = () => new URLSearchParams(window.location.search).get("color") ?? "";

const SORT_OPTIONS: { value: SortKey; key: string }[] = [
  { value: "featured", key: "collection.sort.featured" },
  { value: "newest", key: "collection.sort.newest" },
  { value: "price-asc", key: "collection.sort.price_asc" },
  { value: "price-desc", key: "collection.sort.price_desc" },
  { value: "name-asc", key: "collection.sort.name_asc" },
  { value: "name-desc", key: "collection.sort.name_desc" },
];

/**
 * Filtering, sorting and paging all happen in the browser, as in the source
 * shop: the server hands over the whole collection once and the page stays
 * static. The homepage colour gallery links in with ?color=slug.
 */
export default function CollectionView({
  products,
  facets,
}: {
  products: Product[];
  facets: Facets;
}) {
  const { t, locale } = useI18n();

  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    colors: [],
    sizes: [],
    fabrics: [],
    inStockOnly: false,
    maxPrice: facets.priceMax,
  });

  const [touched, setTouched] = useState(false);
  const urlColor = useSyncExternalStore(noopSubscribe, readUrlColor, () => "");

  // Until the shopper changes anything, the colour gallery's link wins.
  const active = useMemo<FilterState>(
    () => (touched || !urlColor ? filters : { ...filters, colors: [urlColor] }),
    [touched, urlColor, filters],
  );

  const [sort, setSort] = useState<SortKey>("featured");
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const activeFilterCount =
    active.categories.length +
    active.colors.length +
    active.sizes.length +
    active.fabrics.length +
    (active.inStockOnly ? 1 : 0) +
    (active.maxPrice < facets.priceMax ? 1 : 0);

  const sorted = useMemo(() => {
    const list = products.filter(
      (p) =>
        (active.categories.length === 0 || active.categories.includes(p.category)) &&
        (active.colors.length === 0 || active.colors.includes(p.color.slug)) &&
        (active.sizes.length === 0 || active.sizes.some((s) => p.sizes.includes(s))) &&
        (active.fabrics.length === 0 || active.fabrics.includes(p.fabric)) &&
        (!active.inStockOnly || p.in_stock) &&
        p.price <= active.maxPrice,
    );

    switch (sort) {
      case "price-asc":
        return [...list].sort((a, b) => a.price - b.price);
      case "price-desc":
        return [...list].sort((a, b) => b.price - a.price);
      case "name-asc":
        return [...list].sort((a, b) => a.name.localeCompare(b.name, locale));
      case "name-desc":
        return [...list].sort((a, b) => b.name.localeCompare(a.name, locale));
      case "newest":
        return [...list].sort((a, b) => Number(b.is_new) - Number(a.is_new));
      default:
        return list;
    }
  }, [products, active, sort, locale]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  const current = Math.min(page, totalPages);
  const paginated = sorted.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  function update(next: FilterState) {
    setTouched(true);
    setFilters(next);
    setPage(1);
  }

  function clearFilters() {
    update({
      categories: [],
      colors: [],
      sizes: [],
      fabrics: [],
      inStockOnly: false,
      maxPrice: facets.priceMax,
    });
  }

  function goToPage(target: number) {
    setPage(target);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="mb-6 flex items-center justify-between gap-4 sm:mb-8">
        <button
          type="button"
          className="flex items-center gap-2 text-xs tracking-wide2 uppercase lg:hidden"
          onClick={() => setDrawerOpen(true)}
        >
          <Icon name="filter" size={16} />
          {t("collection.filter")}
          {activeFilterCount > 0 && (
            <span className="flex h-[18px] w-[18px] items-center justify-center bg-ink text-[10px] text-paper">
              {activeFilterCount}
            </span>
          )}
        </button>

        <p className="hidden text-xs text-ink/50 lg:block">
          {t("collection.count", { count: sorted.length })}
        </p>

        <label className="flex items-center gap-2">
          <span className="sr-only">{t("collection.sort_label")}</span>
          <select
            value={sort}
            onChange={(event) => {
              setSort(event.target.value as SortKey);
              setPage(1);
            }}
            className="border-0 bg-transparent py-1 pr-7 text-xs tracking-wide2 uppercase focus:outline-none"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.key)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="lg:grid lg:grid-cols-[15rem_1fr] lg:gap-10">
        <aside className="hidden lg:block" aria-label={t("collection.filters")}>
          <div className="sticky top-32">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-medium tracking-brand uppercase">
                {t("collection.filters")}
              </h2>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  className="text-[11px] text-ink/50 underline underline-offset-4"
                  onClick={clearFilters}
                >
                  {t("collection.clear")}
                </button>
              )}
            </div>
            <FilterPanel filters={active} facets={facets} onChange={update} className="mt-2" />
          </div>
        </aside>

        <div>
          {paginated.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-3 xl:grid-cols-4">
              {paginated.map((product, index) => (
                <ProductCard key={product.slug} product={product} priority={index < 4} />
              ))}
            </div>
          ) : (
            <div className="py-24 text-center">
              <p className="text-sm text-ink/60">{t("collection.empty")}</p>
              <button type="button" className="btn-ghost mt-6" onClick={clearFilters}>
                {t("collection.clear_filters")}
              </button>
            </div>
          )}

          {totalPages > 1 && (
            <nav
              aria-label={t("collection.pagination")}
              className="mt-12 flex items-center justify-center gap-1"
            >
              <button
                type="button"
                className="p-2 disabled:opacity-25"
                disabled={current === 1}
                aria-label={t("collection.prev_page")}
                onClick={() => goToPage(current - 1)}
              >
                <Icon name="chevron-left" size={18} />
              </button>

              {Array.from({ length: totalPages }, (_, index) => index + 1).map((target) => (
                <button
                  key={target}
                  type="button"
                  aria-current={target === current ? "page" : undefined}
                  onClick={() => goToPage(target)}
                  className={`h-9 w-9 text-xs transition-colors ${
                    target === current ? "bg-ink text-paper" : "hover:bg-mist"
                  }`}
                >
                  {target}
                </button>
              ))}

              <button
                type="button"
                className="p-2 disabled:opacity-25"
                disabled={current === totalPages}
                aria-label={t("collection.next_page")}
                onClick={() => goToPage(current + 1)}
              >
                <Icon name="chevron-right" size={18} />
              </button>
            </nav>
          )}
        </div>
      </div>

      <DrawerShell
        open={drawerOpen}
        title={t("collection.filter")}
        onClose={() => setDrawerOpen(false)}
        footer={
          <div className="flex gap-3 border-t border-line p-4">
            <button type="button" className="btn-secondary flex-1" onClick={clearFilters}>
              {t("collection.clear")}
            </button>
            <button type="button" className="btn-primary flex-1" onClick={() => setDrawerOpen(false)}>
              {t("collection.view_count", { count: sorted.length })}
            </button>
          </div>
        }
      >
        <FilterPanel filters={active} facets={facets} onChange={update} className="px-5" />
      </DrawerShell>
    </div>
  );
}
