"use client";

import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { useI18n } from "./I18nProvider";
import PriceTag from "./PriceTag";

export default function ProductCard({
  product,
  priority = false,
}: {
  product: Product;
  priority?: boolean;
}) {
  const { t, path } = useI18n();

  return (
    <Link href={path(`/products/${product.slug}`)} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden bg-mist">
        {product.images[0] && (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            priority={priority}
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-opacity duration-300 group-hover:opacity-0"
          />
        )}
        {product.images[1] && (
          <Image
            src={product.images[1]}
            alt=""
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          />
        )}

        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.compare_at && (
            <span className="bg-ink px-2.5 py-1 text-[10px] font-medium tracking-wide2 text-paper uppercase">
              {t("product.sale")}
            </span>
          )}
          {/* Pre-order wins over sold out: the item is buyable, just not in hand. */}
          {product.is_preorder ? (
            <span className="bg-paper px-2.5 py-1 text-[10px] font-medium tracking-wide2 text-ink uppercase">
              {t("product.preorder.badge")}
            </span>
          ) : (
            !product.in_stock && (
              <span className="bg-paper px-2.5 py-1 text-[10px] font-medium tracking-wide2 text-ink uppercase">
                {t("product.sold_out")}
              </span>
            )
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-1.5 sm:mt-4">
        <h3 className="text-xs tracking-wide2 uppercase sm:text-sm">{product.name}</h3>
        <PriceTag price={product.price} compareAt={product.compare_at} />
        <p className="hidden pt-1 text-[11px] tracking-wide2 uppercase underline decoration-line-strong underline-offset-4 transition-colors group-hover:decoration-ink sm:block">
          {t("product.card_cta")}
        </p>
      </div>
    </Link>
  );
}
