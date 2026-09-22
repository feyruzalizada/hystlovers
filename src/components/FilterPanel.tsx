"use client";

import type { Facets } from "@/lib/types";
import { useI18n } from "./I18nProvider";
import { useShop } from "./ShopProvider";
import Icon from "./Icon";

export type FilterState = {
  categories: string[];
  colors: string[];
  sizes: string[];
  fabrics: string[];
  inStockOnly: boolean;
  maxPrice: number;
};

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value];
}

export default function FilterPanel({
  filters,
  facets,
  onChange,
  className,
}: {
  filters: FilterState;
  facets: Facets;
  onChange: (next: FilterState) => void;
  className?: string;
}) {
  const { t } = useI18n();
  const { formatPrice } = useShop();

  const set = <K extends keyof FilterState>(key: K, value: FilterState[K]) =>
    onChange({ ...filters, [key]: value });

  const checkbox = (
    legend: string,
    values: string[],
    selected: string[],
    key: "categories" | "fabrics",
  ) =>
    values.length > 0 && (
      <fieldset className="py-5">
        <legend className="text-xs font-medium tracking-wide2 uppercase">{legend}</legend>
        <div className="mt-4 space-y-3">
          {values.map((value) => {
            const active = selected.includes(value);
            return (
              <label key={value} className="flex cursor-pointer items-center gap-3 text-sm">
                <span
                  className={`flex h-4.5 w-4.5 items-center justify-center border transition-colors ${
                    active ? "border-ink bg-ink text-paper" : "border-line-strong"
                  }`}
                >
                  {active && <Icon name="check" size={12} />}
                </span>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={active}
                  onChange={() => set(key, toggle(selected, value))}
                />
                {value}
              </label>
            );
          })}
        </div>
      </fieldset>
    );

  return (
    <div className={`divide-y divide-line ${className ?? ""}`}>
      <div className="flex items-center justify-between py-5">
        <span className="text-xs font-medium tracking-wide2 uppercase">
          {t("collection.filter.in_stock_only")}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={filters.inStockOnly}
          onClick={() => set("inStockOnly", !filters.inStockOnly)}
          className={`relative h-5 w-9 transition-colors ${
            filters.inStockOnly ? "bg-ink" : "bg-line-strong"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-4 w-4 bg-paper transition-transform ${
              filters.inStockOnly ? "translate-x-4" : ""
            }`}
          />
        </button>
      </div>

      {checkbox(t("collection.filter.category"), facets.categories, filters.categories, "categories")}

      <div className="py-5">
        <p className="text-xs font-medium tracking-wide2 uppercase">{t("collection.filter.price")}</p>
        <input
          type="range"
          min={0}
          max={facets.priceMax}
          step={50}
          value={filters.maxPrice}
          aria-label={t("collection.filter.max_price")}
          onChange={(event) => set("maxPrice", Number(event.target.value))}
          className="mt-4 w-full accent-ink"
        />
        <p className="mt-2 text-xs text-ink/60">
          {formatPrice(0)} — {formatPrice(filters.maxPrice)}
        </p>
      </div>

      {facets.sizes.length > 0 && (
        <fieldset className="py-5">
          <legend className="text-xs font-medium tracking-wide2 uppercase">
            {t("collection.filter.size")}
          </legend>
          <div className="mt-4 flex flex-wrap gap-2">
            {facets.sizes.map((size) => {
              const active = filters.sizes.includes(size);
              return (
                <button
                  key={size}
                  type="button"
                  aria-pressed={active}
                  onClick={() => set("sizes", toggle(filters.sizes, size))}
                  className={`border px-4 py-2 text-xs transition-colors ${
                    active ? "border-ink bg-ink text-paper" : "border-line-strong hover:border-ink"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {facets.colors.length > 0 && (
        <fieldset className="py-5">
          <legend className="text-xs font-medium tracking-wide2 uppercase">
            {t("collection.filter.color")}
          </legend>
          <div className="mt-4 flex flex-wrap gap-2.5">
            {facets.colors.map((color) => {
              const active = filters.colors.includes(color.slug);
              return (
                <button
                  key={color.slug}
                  type="button"
                  title={color.name}
                  aria-pressed={active}
                  onClick={() => set("colors", toggle(filters.colors, color.slug))}
                  style={{ background: color.hex }}
                  className={`relative h-8 w-8 rounded-full border transition-transform hover:scale-110 ${
                    active ? "border-ink ring-1 ring-ink ring-offset-2" : "border-ink/15"
                  }`}
                >
                  <span className="sr-only">{color.name}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {checkbox(t("collection.filter.fabric"), facets.fabrics, filters.fabrics, "fabrics")}
    </div>
  );
}
