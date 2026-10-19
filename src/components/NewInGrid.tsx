"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/lib/types";
import { useI18n } from "./I18nProvider";
import { useCart } from "./CartProvider";
import { useShop } from "./ShopProvider";
import Icon from "./Icon";

const PAGE = 4;
// Wide, narrow / narrow, wide — the second row mirrors the first.
const SPANS = ["col-span-2", "col-span-1", "col-span-1", "col-span-2"];

function Card({ product, wide }: { product: Product; wide: boolean }) {
  const { t, path } = useI18n();
  const cart = useCart();
  const { formatPrice } = useShop();
  const [picking, setPicking] = useState(false);

  const sizes = product.sizes.filter((size) => product.size_stock[size]?.available ?? product.in_stock);

  function add(size: string) {
    setPicking(false);
    cart.add({
      slug: product.slug,
      name: product.name,
      price: product.price,
      compareAt: product.compare_at,
      image: product.images[0] ?? null,
      color: product.color.name,
      size,
      isPreorder: product.is_preorder,
    });
  }

  return (
    <div className="group relative flex h-full flex-col bg-mist">
      <Link href={path(`/products/${product.slug}`)} className="relative block min-h-0 flex-1">
        {product.images[0] && (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes={wide ? "(max-width: 1024px) 100vw, 66vw" : "(max-width: 1024px) 50vw, 33vw"}
            className="object-contain p-4 transition-transform duration-500 group-hover:scale-[1.03] sm:p-6"
          />
        )}
        {sizes.length === 0 && (
          <span className="absolute top-3 left-3 bg-paper px-2.5 py-1 text-[10px] font-medium tracking-wide2 text-ink uppercase">
            {t("product.sold_out")}
          </span>
        )}
      </Link>

      <div className="flex items-end justify-between gap-3 p-3 sm:p-4">
        <Link href={path(`/products/${product.slug}`)} className="min-w-0">
          <p className="flex items-baseline gap-1.5 text-sm whitespace-nowrap">
            <span className={`font-semibold ${product.compare_at ? "text-sale" : ""}`}>{formatPrice(product.price)}</span>
            {product.compare_at ? (
              <span className="text-xs text-ink/40 line-through">{formatPrice(product.compare_at)}</span>
            ) : null}
          </p>
          <p className="mt-1 truncate text-xs text-ink/60">{product.name}</p>
        </Link>

        {sizes.length > 0 && (
          <button
            type="button"
            aria-label={t("product.add_to_cart")}
            aria-expanded={picking}
            onClick={() => (sizes.length === 1 ? add(sizes[0]) : setPicking((value) => !value))}
            className="flex h-9 w-9 shrink-0 items-center justify-center bg-ink text-paper transition-opacity hover:opacity-80"
          >
            <Icon name={picking ? "close" : "bag"} size={16} />
          </button>
        )}
      </div>

      {picking && (
        <div className="absolute right-3 bottom-14 flex gap-1.5 sm:right-4 sm:bottom-16" role="group" aria-label={t("product.size")}>
          {sizes.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => add(size)}
              className="border border-ink bg-paper px-3 py-1.5 text-[11px] tracking-wide2 uppercase transition-colors hover:bg-ink hover:text-paper"
            >
              {size}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NewInGrid({ title, url, products }: { title: string; url: string; products: Product[] }) {
  const { t, path } = useI18n();
  const [page, setPage] = useState(0);
  const pages = Math.ceil(products.length / PAGE);
  const shown = products.slice(page * PAGE, page * PAGE + PAGE);

  const control = "flex h-9 items-center justify-center border-line text-ink transition-colors hover:bg-mist disabled:text-ink/25 disabled:hover:bg-transparent sm:h-10";

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4 sm:mb-8">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
        <div className="flex shrink-0 border border-line">
          <Link href={path(url)} className={`${control} px-3 text-[11px] sm:px-4 sm:text-xs`}>
            {t("home.view_all_short")}
          </Link>
          {pages > 1 && (
            <>
              <button
                type="button"
                aria-label={t("blog.prev")}
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
                className={`${control} w-9 border-l sm:w-10`}
              >
                <Icon name="arrow-right" size={16} className="rotate-180" />
              </button>
              <button
                type="button"
                aria-label={t("blog.next")}
                disabled={page === pages - 1}
                onClick={() => setPage(page + 1)}
                className={`${control} w-9 border-l sm:w-10`}
              >
                <Icon name="arrow-right" size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid auto-rows-[16rem] grid-cols-2 gap-3 sm:auto-rows-[20rem] sm:gap-4 lg:grid-cols-3 lg:auto-rows-[24rem]">
        {shown.map((product, index) => {
          // On phones the narrow pair shares a row between two full-width cards.
          const span = SPANS[index];
          return (
            <div key={product.slug} className={span}>
              <Card product={product} wide={span === "col-span-2"} />
            </div>
          );
        })}
      </div>
    </>
  );
}
