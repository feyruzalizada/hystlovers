"use client";

import { createContext, useContext, useMemo } from "react";
import type { ShopSettings } from "@/lib/types";

type ShopValue = ShopSettings & { formatPrice: (amount: number) => string };

const ShopContext = createContext<ShopValue | null>(null);

export function ShopProvider({ shop, children }: { shop: ShopSettings; children: React.ReactNode }) {
  const value = useMemo<ShopValue>(
    () => ({
      ...shop,
      formatPrice: (amount: number) => {
        const rounded = Number.isInteger(amount) ? amount.toString() : amount.toFixed(2);
        return `${rounded} ${shop.currency.symbol}`;
      },
    }),
    [shop],
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop(): ShopValue {
  const value = useContext(ShopContext);
  if (!value) throw new Error("useShop must be used inside ShopProvider");
  return value;
}
