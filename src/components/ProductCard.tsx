"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { useI18n } from "./I18nProvider";

export default function ProductCard({ product }: { product: Product }) {
  const { t, path } = useI18n();
  const [hovered, setHovered] = useState(false);
  const image = hovered && product.images[1] ? product.images[1] : product.images[0];
  const onSale = product.compare_at != null && product.compare_at > product.price;

  return (
    <Link
      href={path(`/products/${product.slug}`)}
      className="group block"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-mist">
        {image && (
          <Image
            src={image}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-opacity duration-300"
          />
        )}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {onSale && (
            <span className="bg-sale px-2 py-1 text-[10px] tracking-brand text-paper uppercase">
              {t("product.sale")}
            </span>
          )}
          {product.is_preorder && (
            <span className="bg-ink px-2 py-1 text-[10px] tracking-brand text-paper uppercase">
              {t("product.preorder.badge")}
            </span>
          )}
        </div>
        {!product.in_stock && !product.is_preorder && (
          <div className="absolute inset-x-0 bottom-0 bg-paper/90 py-2 text-center text-[11px] tracking-brand uppercase">
            {t("product.sold_out")}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-1">
        <h3 className="text-xs tracking-brand uppercase">{product.name}</h3>
        <p className="text-xs text-ink-soft">{product.color.name}</p>
        <p className="text-sm">
          {onSale && (
            <span className="mr-2 text-ink-soft line-through">{formatPrice(product.compare_at!)}</span>
          )}
          <span className={onSale ? "text-sale" : undefined}>{formatPrice(product.price)}</span>
        </p>
      </div>
    </Link>
  );
}
