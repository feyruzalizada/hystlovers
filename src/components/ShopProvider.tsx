"use client";

import { createContext, useContext, useMemo } from "react";
import type { ShopSettings } from "@/lib/types";
import { useI18n } from "./I18nProvider";
import { formatMoney } from "@/lib/money";

type ShopValue = ShopSettings & { formatPrice: (amount: number) => string };

const ShopContext = createContext<ShopValue | null>(null);

export function ShopProvider({ shop, children }: { shop: ShopSettings; children: React.ReactNode }) {
  const { locale } = useI18n();

  const value = useMemo<ShopValue>(
    () => ({ ...shop, formatPrice: (amount: number) => formatMoney(amount, locale, shop.currency.symbol) }),
    [shop, locale],
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop(): ShopValue {
  const value = useContext(ShopContext);
  if (!value) throw new Error("useShop must be used inside ShopProvider");
  return value;
}
