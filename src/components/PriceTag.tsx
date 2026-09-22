"use client";

import { useShop } from "./ShopProvider";

export default function PriceTag({
  price,
  compareAt,
  size = "sm",
  className = "",
}: {
  price: number;
  compareAt?: number | null;
  size?: "sm" | "lg";
  className?: string;
}) {
  const { formatPrice } = useShop();

  return (
    <p className={`flex items-baseline gap-2 ${size === "lg" ? "text-lg" : "text-sm"} ${className}`.trim()}>
      {compareAt ? <span className="text-ink/40 line-through">{formatPrice(compareAt)}</span> : null}
      <span className={`font-medium ${compareAt ? "text-sale" : "text-ink"}`}>
        {formatPrice(price)}
      </span>
    </p>
  );
}
