import type { Product } from "@/payload-types";
import type { Locale } from "./types";

/** "LOVE T-SHIRT - BROWN (SHIRT, TROUSERS)" — the source shop's naming. */
export function productName(doc: Pick<Product, "series" | "item" | "colorName" | "setParts">, locale: Locale): string {
  const setParts = (doc.setParts ?? []).map((part) => part.value).filter(Boolean);
  let name = `${doc.series} ${doc.item}`.toUpperCase() + " - " + String(doc.colorName ?? "").toLocaleUpperCase(locale);
  if (setParts.length > 0) name += ` (${setParts.join(", ").toUpperCase()})`;
  return name;
}
