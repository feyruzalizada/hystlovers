"use client";

import { createContext, useContext, useMemo } from "react";
import type { ShopSettings } from "@/lib/types";
import { useI18n } from "./I18nProvider";

type ShopValue = ShopSettings & { formatPrice: (amount: number) => string };

const ShopContext = createContext<ShopValue | null>(null);

export function ShopProvider({ shop, children }: { shop: ShopSettings; children: React.ReactNode }) {
  const { locale } = useI18n();

  const value = useMemo<ShopValue>(() => {
    // Always two decimals, grouped the way each language expects. Browsers ship
    // no Azerbaijani number data and fall back to the English grouping, which is
    // what the source shop renders; pinning it keeps the prerendered HTML and
    // the browser from disagreeing.
    const formatter = new Intl.NumberFormat(locale === "az" ? "en" : locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return {
      ...shop,
      formatPrice: (amount: number) => `${formatter.format(amount ?? 0)} ${shop.currency.symbol}`,
    };
  }, [shop, locale]);

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop(): ShopValue {
  const value = useContext(ShopContext);
  if (!value) throw new Error("useShop must be used inside ShopProvider");
  return value;
}
