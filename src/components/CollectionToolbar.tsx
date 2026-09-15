"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { Facets, SortKey } from "@/lib/types";
import { useI18n } from "./I18nProvider";
import { useShop } from "./ShopProvider";

const sortKeys: SortKey[] = ["featured", "newest", "price_asc", "price_desc", "name_asc", "name_desc"];

export default function CollectionToolbar({ facets, total }: { facets: Facets; total: number }) {
  const { t } = useI18n();
  const { formatPrice } = useShop();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);

  const selected = (key: string) => params.getAll(key);
  const hasFilters = ["category", "color", "size", "fabric", "max_price", "in_stock"].some((key) =>
    params.has(key),
  );

  function update(mutate: (next: URLSearchParams) => void) {
    const next = new URLSearchParams(params.toString());
    mutate(next);
    next.delete("page");
    router.push(`${pathname}${next.toString() ? `?${next}` : ""}`, { scroll: false });
  }

  function toggle(key: string, value: string) {
    update((next) => {
      const current = next.getAll(key);
      next.delete(key);
      const remaining = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      remaining.forEach((v) => next.append(key, v));
    });
  }

  const group = (key: string, title: string, values: { value: string; label: string; hex?: string }[]) =>
    values.length > 0 && (
      <fieldset key={key} className="border-b border-line py-5">
        <legend className="heading-brand text-xs">{title}</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {values.map((item) => {
            const active = selected(key).includes(item.value);
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => toggle(key, item.value)}
                className={`flex items-center gap-2 border px-3 py-2 text-xs tracking-brand uppercase ${
                  active ? "border-ink bg-ink text-paper" : "border-line text-ink-soft hover:border-ink"
                }`}
              >
                {item.hex && (
                  <span
                    className="inline-block h-3 w-3 border border-line"
                    style={{ backgroundColor: item.hex }}
                  />
                )}
                {item.label}
              </button>
            );
          })}
        </div>
      </fieldset>
    );

  return (
    <div className="border-y border-line">
      <div className="flex items-center justify-between gap-4 py-4">
        <button type="button" className="btn-ghost" onClick={() => setOpen((v) => !v)}>
          {open ? t("collection.filters") : t("collection.filter")}
        </button>

        <span className="text-xs tracking-brand text-ink-soft uppercase">
          {t("collection.count", { count: total })}
        </span>

        <label className="flex items-center gap-2 text-xs tracking-brand uppercase">
          <span className="hidden sm:inline">{t("collection.sort_label")}</span>
          <select
            value={params.get("sort") ?? "featured"}
            onChange={(event) =>
              update((next) =>
                event.target.value === "featured"
                  ? next.delete("sort")
                  : next.set("sort", event.target.value),
              )
            }
            className="border border-line bg-paper px-3 py-2 text-xs tracking-brand uppercase"
          >
            {sortKeys.map((key) => (
              <option key={key} value={key}>
                {t(`collection.sort.${key}`)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {open && (
        <div className="pb-6">
          {group(
            "category",
            t("collection.filter.category"),
            facets.categories.map((c) => ({ value: c, label: c })),
          )}
          {group(
            "color",
            t("collection.filter.color"),
            facets.colors.map((c) => ({ value: c.slug, label: c.name, hex: c.hex })),
          )}
          {group(
            "size",
            t("collection.filter.size"),
            facets.sizes.map((s) => ({ value: s, label: s })),
          )}
          {group(
            "fabric",
            t("collection.filter.fabric"),
            facets.fabrics.map((f) => ({ value: f, label: f })),
          )}

          <fieldset className="border-b border-line py-5">
            <legend className="heading-brand text-xs">{t("collection.filter.price")}</legend>
            <div className="mt-3 flex items-center gap-4">
              <input
                type="range"
                min={0}
                max={facets.priceMax}
                step={5}
                defaultValue={Number(params.get("max_price") ?? facets.priceMax)}
                onMouseUp={(event) =>
                  update((next) => next.set("max_price", (event.target as HTMLInputElement).value))
                }
                onTouchEnd={(event) =>
                  update((next) => next.set("max_price", (event.target as HTMLInputElement).value))
                }
                className="w-56"
              />
              <span className="text-xs text-ink-soft">
                {t("collection.filter.max_price")}:{" "}
                {formatPrice(Number(params.get("max_price") ?? facets.priceMax))}
              </span>
            </div>
          </fieldset>

          <div className="flex items-center justify-between py-5">
            <label className="flex items-center gap-2 text-xs tracking-brand uppercase">
              <input
                type="checkbox"
                checked={params.get("in_stock") === "1"}
                onChange={(event) =>
                  update((next) =>
                    event.target.checked ? next.set("in_stock", "1") : next.delete("in_stock"),
                  )
                }
              />
              {t("collection.filter.in_stock_only")}
            </label>

            {hasFilters && (
              <button
                type="button"
                className="btn-ghost"
                onClick={() => router.push(pathname, { scroll: false })}
              >
                {t("collection.clear_filters")}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
