import type { Locale } from "./types";

const formatters = new Map<string, Intl.NumberFormat>();

/**
 * Two decimals, grouped the way each language writes numbers. Browsers ship no
 * Azerbaijani number data, so az is built from the English format with the
 * separators swapped (1.234,56) — the same in Node and every browser.
 */
export function formatMoney(amount: number, locale: Locale, symbol: string): string {
  const tag = locale === "az" ? "en" : locale;
  if (!formatters.has(tag)) {
    formatters.set(tag, new Intl.NumberFormat(tag, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  }
  let number = formatters.get(tag)!.format(amount ?? 0);
  if (locale === "az") number = number.replace(/[.,]/g, (separator) => (separator === "." ? "," : "."));
  return `${number} ${symbol}`;
}
