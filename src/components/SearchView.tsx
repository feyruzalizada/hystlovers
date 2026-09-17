"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Product } from "@/lib/types";
import { useI18n } from "./I18nProvider";
import Icon from "./Icon";
import ProductCard from "./ProductCard";

export default function SearchView({ query, results }: { query: string; results: Product[] }) {
  const { t, path } = useI18n();
  const router = useRouter();
  const [input, setInput] = useState(query);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const q = input.trim();
    if (q) router.push(path(`/search?q=${encodeURIComponent(q)}`));
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="heading-brand text-center text-2xl">{t("search.title")}</h1>

      <form onSubmit={submit} className="mx-auto mt-8 flex max-w-xl border-b border-ink">
        <input
          type="search"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={t("nav.search_placeholder")}
          aria-label={t("nav.search")}
          className="w-full bg-transparent py-3 text-base focus:outline-none"
        />
        <button type="submit" className="p-3" aria-label={t("nav.search_submit")}>
          <Icon name="search" size={20} />
        </button>
      </form>

      {query && (
        <>
          <p className="mt-10 text-center text-sm text-ink/60">
            {t("search.count", { query, count: results.length })}
          </p>

          {results.length > 0 ? (
            <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-4">
              {results.map((product, index) => (
                <ProductCard key={product.slug} product={product} priority={index < 4} />
              ))}
            </div>
          ) : (
            <div className="mt-6 text-center">
              <p className="text-sm text-ink/60">{t("search.empty")}</p>
              <Link href={path("/collections/all-products")} className="btn-secondary mt-8">
                {t("nav.all_products")}
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
