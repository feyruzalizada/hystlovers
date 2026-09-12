import shop from "@/data/shop.json";

export function formatPrice(amount: number): string {
  const rounded = Number.isInteger(amount) ? amount.toString() : amount.toFixed(2);
  return `${rounded} ${shop.currency.symbol}`;
}
