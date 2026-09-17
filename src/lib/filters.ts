import type { CollectionFilters, Product, SortKey } from "./types";

export const PER_PAGE = 12;

const sorters: Record<SortKey, (a: Product, b: Product) => number> = {
  featured: () => 0,
  newest: (a, b) => Number(b.is_new) - Number(a.is_new),
  "price-asc": (a, b) => a.price - b.price,
  "price-desc": (a, b) => b.price - a.price,
  "name-asc": (a, b) => a.name.localeCompare(b.name),
  "name-desc": (a, b) => b.name.localeCompare(a.name),
};

export function applyFilters(pool: Product[], filters: CollectionFilters) {
  let list = pool.filter((p) => {
    if (filters.category?.length && !filters.category.includes(p.category)) return false;
    if (filters.color?.length && !filters.color.includes(p.color.slug)) return false;
    if (filters.fabric?.length && !filters.fabric.includes(p.fabric)) return false;
    if (filters.size?.length && !filters.size.some((s) => p.sizes.includes(s))) return false;
    if (filters.maxPrice != null && p.price > filters.maxPrice) return false;
    if (filters.inStockOnly && !p.in_stock) return false;
    return true;
  });

  list = [...list].sort(sorters[filters.sort ?? "featured"]);

  const page = Math.max(1, filters.page ?? 1);
  const lastPage = Math.max(1, Math.ceil(list.length / PER_PAGE));
  const start = (page - 1) * PER_PAGE;

  return {
    items: list.slice(start, start + PER_PAGE),
    total: list.length,
    page,
    lastPage,
  };
}

